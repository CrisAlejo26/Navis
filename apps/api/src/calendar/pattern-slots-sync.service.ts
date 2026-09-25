import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { MeetingSlot } from './meeting-slot.entity';
import { Meeting } from './meeting.entity';
import { mergeSlots } from './merge-pattern-slots';
import { SLOTS_WITH_PEOPLE } from './slot-people';

/**
 * Lleva a las reuniones ya materializadas de un patrón los cambios de sus
 * fases. Sin esto, la fase nueva solo aparecía en los días aún sin tocar, y en
 * los que ya tenían datos no salía ni vaciándolos: la reunión guarda su propia
 * copia de las fases (`meeting_slots`).
 */
@Injectable()
export class PatternSlotsSyncService {
    constructor(
        @InjectRepository(Meeting) private readonly meetings: Repository<Meeting>,
        @InjectRepository(MeetingSlot) private readonly slots: Repository<MeetingSlot>,
    ) {}

    async apply(patternId: string, before: readonly string[], after: readonly string[]) {
        const materialized = await this.meetings.find({
            where: { patternId },
            relations: SLOTS_WITH_PEOPLE,
        });

        for (const meeting of materialized) {
            const plan = mergeSlots(
                (meeting.slots ?? []).map((slot) => ({
                    id: slot.id,
                    name: slot.name,
                    position: slot.position,
                    note: slot.note,
                    peopleCount: slot.people?.length ?? 0,
                })),
                before,
                after,
            );

            if (plan.dropIds.length > 0) await this.slots.delete({ id: In(plan.dropIds) });
            for (const { id, position } of plan.keep) await this.slots.update({ id }, { position });
            await this.slots.save(
                plan.create.map(({ name, position }) =>
                    this.slots.create({ meetingId: meeting.id, name, position }),
                ),
            );
        }
    }
}
