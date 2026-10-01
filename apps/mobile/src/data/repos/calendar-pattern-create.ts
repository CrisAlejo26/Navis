import type { CreatePatternInput } from '@navis/shared';
import { getDb, newId, nowIso } from '../db';
import { assertInChurch } from '../church-scope';
export async function createPattern(
    churchId: string,
    calendarId: string,
    input: CreatePatternInput,
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    await db.withTransactionAsync(async () => {
        await assertInChurch(db, 'calendars', calendarId, churchId);
        await assertInChurch(db, 'congregations', input.congregationId, churchId);
        const repetido = await db.getFirstAsync<{ total: number }>(
            `SELECT COUNT(*) AS total FROM meeting_patterns
       WHERE church_id = ? AND calendar_id = ? AND congregation_id = ? AND weekday = ? AND start_time = ? AND deleted_at IS NULL`,
            churchId,
            calendarId,
            input.congregationId,
            input.weekday,
            input.startTime,
        );
        if ((repetido?.total ?? 0) > 0)
            throw new Error('Ya hay una reunión fija con esa sede, día y hora');

        const patternId = newId();
        const accent =
            input.accent ??
            (
                await db.getFirstAsync<{ accent: string }>(
                    'SELECT accent FROM congregations WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
                    churchId,
                    input.congregationId,
                )
            )?.accent ??
            'primary';

        await db.runAsync(
            `INSERT INTO meeting_patterns (id, created_at, updated_at, deleted_at, church_id, calendar_id, congregation_id, name, weekday, start_time, accent, is_active, valid_from, valid_to)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            patternId,
            now,
            now,
            churchId,
            calendarId,
            input.congregationId,
            input.name,
            input.weekday,
            input.startTime,
            accent,
            input.validFrom ?? null,
            input.validTo ?? null,
        );
        for (const [position, phase] of input.phases.entries()) {
            await db.runAsync(
                'INSERT INTO pattern_phases (id, created_at, updated_at, deleted_at, pattern_id, name, position) SELECT ?, ?, ?, NULL, ?, ?, ? WHERE EXISTS (SELECT id FROM meeting_patterns WHERE id = ? AND church_id = ? AND deleted_at IS NULL)',
                newId(),
                now,
                now,
                patternId,
                phase.name,
                position,
                patternId,
                churchId,
            );
        }
    });
}
