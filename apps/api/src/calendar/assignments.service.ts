import {
    BadRequestException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isSchedulable, type AssignSlotInput, type Meeting as MeetingView } from '@navis/shared';
import { DataSource, Repository } from 'typeorm';

import { BelieversService } from '../believers/believers.service';
import { MeetingSlotBeliever } from './meeting-slot-believer.entity';
import { MeetingSlot } from './meeting-slot.entity';
import { Meeting } from './meeting.entity';
import { MeetingsService } from './meetings.service';
import { PatternsService } from './patterns.service';
import { slotBelieverIds } from './slot-people';

/**
 * Asignar es la primitiva de este calendario (D4): un clic pone a alguien en
 * una fase y, si la reunión de ese día todavía era una propuesta del patrón,
 * la crea con todas sus fases antes de escribir.
 */
@Injectable()
export class AssignmentsService {
    constructor(
        @InjectRepository(Meeting) private readonly meetings: Repository<Meeting>,
        @InjectRepository(MeetingSlot) private readonly slots: Repository<MeetingSlot>,
        private readonly dataSource: DataSource,
        private readonly patterns: PatternsService,
        private readonly believers: BelieversService,
        private readonly meetingsService: MeetingsService,
    ) {}

    /**
     * Reemplaza a quienes ocupan la fase por `believerIds`, en ese orden. Vacío
     * la deja libre. Una sola primitiva para añadir, quitar y reordenar.
     */
    async assign(churchId: string, input: AssignSlotInput): Promise<MeetingView> {
        const existing = input.meetingId
            ? await this.meetingsService.require(churchId, input.meetingId)
            : null;

        // Solo se comprueba a quien **entra**: si alguien de la fase pasó a inactivo,
        // guardar la nota o reordenar a los demás no puede fallar por él.
        const already = existing ? await this.currentIds(existing.id, input.position) : [];
        await this.requireSchedulable(
            churchId,
            input.believerIds.filter((id) => !already.includes(id)),
        );

        const meeting = existing ?? (await this.ensureMeeting(churchId, input));

        const slot = await this.slots.findOne({
            where: { meetingId: meeting.id, position: input.position },
        });
        if (!slot) throw new NotFoundException('Esa fase no existe en la reunión');

        await this.dataSource.transaction(async (manager) => {
            await manager.delete(MeetingSlotBeliever, { slotId: slot.id });
            if (input.believerIds.length > 0) {
                await manager.save(
                    input.believerIds.map((believerId, position) =>
                        manager.create(MeetingSlotBeliever, {
                            slotId: slot.id,
                            believerId,
                            position,
                        }),
                    ),
                );
            }
            if (input.note !== undefined) {
                await manager.update(MeetingSlot, { id: slot.id }, { note: input.note ?? null });
            }
        });

        return this.meetingsService.view(churchId, meeting.id);
    }

    /** Se programa a quien sigue viniendo: lo dice el estado (RFC 0003 D2). */
    private async requireSchedulable(churchId: string, ids: readonly string[]): Promise<void> {
        for (const id of ids) {
            const person = await this.believers.require(churchId, id);
            if (!isSchedulable(person.status)) {
                throw new UnprocessableEntityException('Esa persona ya no está activa');
            }
        }
    }

    private async currentIds(meetingId: string, position: number): Promise<string[]> {
        const slot = await this.slots.findOne({
            where: { meetingId, position },
            relations: { people: true },
        });
        return slot ? slotBelieverIds(slot) : [];
    }

    /**
     * La reunión de ese patrón y ese día, materializándola si hacía falta.
     *
     * La creación —reunión y fases— va en una transacción, para que no quede
     * nunca una reunión sin sus fases. El reintento se hace **fuera**: si dos
     * clics simultáneos chocan contra el índice único, la transacción perdedora
     * se deshace entera y basta con leer la que ganó.
     */
    private async ensureMeeting(churchId: string, input: AssignSlotInput): Promise<Meeting> {
        const patternId = input.patternId;
        if (!patternId) throw new BadRequestException('Hace falta la reunión o el patrón');

        const found = await this.findByPattern(churchId, patternId, input.date);
        if (found) return found;

        const pattern = await this.patterns.require(churchId, patternId);

        try {
            return await this.dataSource.transaction(async (manager) => {
                const meeting = await manager.save(
                    manager.create(Meeting, {
                        churchId,
                        calendarId: pattern.calendarId,
                        congregationId: pattern.congregationId,
                        patternId: pattern.id,
                        date: input.date,
                        startTime: pattern.startTime,
                        name: pattern.name,
                        accent: pattern.accent,
                        status: 'programada',
                    }),
                );

                await manager.save(
                    pattern.phases.map((phase) =>
                        manager.create(MeetingSlot, {
                            meetingId: meeting.id,
                            name: phase.name,
                            position: phase.position,
                        }),
                    ),
                );

                return meeting;
            });
        } catch (error) {
            const won = await this.findByPattern(churchId, patternId, input.date);
            if (won) return won;
            throw error;
        }
    }

    private findByPattern(
        churchId: string,
        patternId: string,
        date: string,
    ): Promise<Meeting | null> {
        return this.meetings.findOne({ where: { churchId, patternId, date } });
    }
}
