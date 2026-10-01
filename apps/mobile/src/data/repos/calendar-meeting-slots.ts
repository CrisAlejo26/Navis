import type { SetMeetingSlotsInput } from '@navis/shared';
import { getDb, newId, nowIso } from '../db';
import { assertAllInChurch } from '../church-scope';
import { replaceSlotPeople } from './calendar-slot-people';
export async function setMeetingSlots(
    churchId: string,
    input: SetMeetingSlotsInput & { id: string },
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    await db.withTransactionAsync(async () => {
        const meeting = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM meetings WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
            churchId,
            input.id,
        );
        if (!meeting) throw new Error('Esa reunión no existe en esta iglesia');
        await assertAllInChurch(
            db,
            'believers',
            input.slots.flatMap((slot) => slot.believerIds ?? []),
            churchId,
        );

        // Sin claves ajenas en local: las personas de las fases que se van se
        // borran a mano, o quedarían huérfanas.
        await db.runAsync(
            'DELETE FROM meeting_slot_believers WHERE slot_id IN (SELECT id FROM meeting_slots WHERE meeting_id = ?) AND slot_id IN (SELECT id FROM meeting_slots WHERE meeting_id IN (SELECT id FROM meetings WHERE church_id = ?)) ',
            input.id,
            churchId,
        );
        await db.runAsync(
            'DELETE FROM meeting_slots WHERE meeting_id = ? AND meeting_slots.meeting_id IN (SELECT id FROM meetings WHERE church_id = ? AND deleted_at IS NULL) ',
            input.id,
            churchId,
        );
        for (const [position, slot] of input.slots.entries()) {
            const slotId = newId();
            await db.runAsync(
                'INSERT INTO meeting_slots (id, created_at, updated_at, deleted_at, meeting_id, name, position, note) SELECT ?, ?, ?, NULL, ?, ?, ?, ? WHERE EXISTS (SELECT id FROM meetings WHERE id = ? AND church_id = ? AND deleted_at IS NULL)',
                slotId,
                now,
                now,
                input.id,
                slot.name,
                position,
                slot.note ?? null,
                input.id,
                churchId,
            );
            await replaceSlotPeople(db, slotId, slot.believerIds ?? [], now, newId);
        }
    });
}
