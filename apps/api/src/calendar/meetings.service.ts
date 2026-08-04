import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  CreateMeetingInput,
  Meeting as MeetingView,
  SetMeetingSlotsInput,
  UpdateMeetingInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { BelieversService } from '../believers/believers.service';
import { meetingView } from './calendar-format';
import { CongregationsService } from './congregations.service';
import { MeetingSlot } from './meeting-slot.entity';
import { Meeting } from './meeting.entity';

/**
 * Las reuniones ya materializadas: las puntuales, las que se editan y las que
 * se cancelan. Materializar una propuesta del patrón es cosa de
 * `AssignmentsService`, porque pasa al asignar (D4).
 */
@Injectable()
export class MeetingsService {
  constructor(
    @InjectRepository(Meeting) private readonly meetings: Repository<Meeting>,
    @InjectRepository(MeetingSlot) private readonly slots: Repository<MeetingSlot>,
    private readonly congregations: CongregationsService,
    private readonly believers: BelieversService,
  ) {}

  /** Una reunión puntual: la que no nace de ningún patrón. */
  async create(
    churchId: string,
    calendarId: string,
    input: CreateMeetingInput,
  ): Promise<MeetingView> {
    const congregation = await this.congregations.require(churchId, input.congregationId);

    const meeting = await this.meetings.save(
      this.meetings.create({
        churchId,
        calendarId,
        congregationId: congregation.id,
        patternId: null,
        date: input.date,
        startTime: input.startTime,
        name: input.name,
        accent: congregation.accent,
        status: 'programada',
      }),
    );

    await this.slots.save(
      input.phases.map((phase, position) =>
        this.slots.create({ meetingId: meeting.id, name: phase.name, position }),
      ),
    );

    return this.view(churchId, meeting.id);
  }

  async update(churchId: string, id: string, input: UpdateMeetingInput): Promise<MeetingView> {
    const meeting = await this.require(churchId, id);

    if (input.name !== undefined) meeting.name = input.name;
    if (input.startTime !== undefined) meeting.startTime = input.startTime;
    if (input.notes !== undefined) meeting.notes = input.notes;
    if (input.status !== undefined) meeting.status = input.status;

    if (input.congregationId !== undefined) {
      const congregation = await this.congregations.require(churchId, input.congregationId);
      meeting.congregationId = congregation.id;
      meeting.accent = congregation.accent;
    }

    await this.meetings.save(meeting);
    return this.view(churchId, id);
  }

  /**
   * Reemplaza la lista de fases entera: añadir, quitar y reordenar es una sola
   * acción, y así no hay estados intermedios con dos fases en la posición 3.
   */
  async setSlots(churchId: string, id: string, input: SetMeetingSlotsInput): Promise<MeetingView> {
    const meeting = await this.require(churchId, id);
    await this.slots.delete({ meetingId: meeting.id });

    await this.slots.save(
      input.slots.map((slot, position) =>
        this.slots.create({
          meetingId: meeting.id,
          name: slot.name,
          position,
          believerId: slot.believerId ?? null,
          note: slot.note ?? null,
        }),
      ),
    );

    return this.view(churchId, id);
  }

  /** Borrado lógico. Si nació de un patrón, ese día vuelve a ser una propuesta. */
  async remove(churchId: string, id: string): Promise<void> {
    await this.meetings.softRemove(await this.require(churchId, id));
  }

  async require(churchId: string, id: string): Promise<Meeting> {
    const meeting = await this.meetings.findOne({
      where: { id, churchId },
      relations: { slots: true },
    });
    if (!meeting) throw new NotFoundException('Esa reunión no existe en esta iglesia');
    return meeting;
  }

  /** La reunión tal y como viaja, con el nombre de cada persona ya compuesto. */
  async view(churchId: string, id: string): Promise<MeetingView> {
    const meeting = await this.require(churchId, id);
    const names = await this.believers.namesOf(
      (meeting.slots ?? []).map((slot) => slot.believerId),
    );

    return meetingView(meeting, names);
  }
}
