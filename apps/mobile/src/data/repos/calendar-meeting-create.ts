import type { CreateMeetingInput } from '@navis/shared';
import { getDb, newId, nowIso } from '../db';
import { assertInChurch } from '../church-scope';
export async function createMeeting(
    churchId: string,
    calendarId: string,
    input: CreateMeetingInput,
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    await db.withTransactionAsync(async () => {
        await assertInChurch(db, 'calendars', calendarId, churchId);
        const sede = await db.getFirstAsync<{ accent: string }>(
            'SELECT accent FROM congregations WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
            churchId,
            input.congregationId,
        );
        if (!sede) throw new Error('Esa sede no existe en esta iglesia');

        const meetingId = newId();
        await db.runAsync(
            'INSERT INTO meetings (id, created_at, updated_at, deleted_at, church_id, calendar_id, congregation_id, pattern_id, date, start_time, name, accent, status, notes) VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL)',
            meetingId,
            now,
            now,
            churchId,
            calendarId,
            input.congregationId,
            input.date,
            input.startTime,
            input.name,
            sede.accent,
            'programada',
        );
        for (const [position, phase] of input.phases.entries()) {
            await db.runAsync(
                'INSERT INTO meeting_slots (id, created_at, updated_at, deleted_at, meeting_id, name, position, note) SELECT ?, ?, ?, NULL, ?, ?, ?, NULL WHERE EXISTS (SELECT id FROM meetings WHERE id = ? AND church_id = ? AND deleted_at IS NULL)',
                newId(),
                now,
                now,
                meetingId,
                phase.name,
                position,
                meetingId,
                churchId,
            );
        }
    });
}
