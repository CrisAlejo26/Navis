import { getDb } from '../db';
import { NOTE_KINDS, type NoteCounts, type NoteDay, type NoteKind } from '@navis/shared';
export async function noteCounts(believerId: string, churchId: string): Promise<NoteCounts> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ kind: string; total: number }>(
        'SELECT kind, COUNT(*) AS total FROM believer_notes WHERE believer_id = ? AND deleted_at IS NULL AND believer_notes.church_id = ? GROUP BY kind',
        believerId,
        churchId,
    );
    const byKind = new Map(rows.map((row) => [row.kind as NoteKind, row.total]));
    const counts = Object.fromEntries(
        NOTE_KINDS.map((kind) => [kind, byKind.get(kind) ?? 0]),
    ) as NoteCounts;
    counts.total = rows.reduce((sum, row) => sum + row.total, 0);
    return counts;
}

export async function noteDays(
    believerId: string,
    from: string,
    to: string,
    churchId: string,
): Promise<NoteDay[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ occurred_at: string; kind: string }>(
        'SELECT occurred_at, kind FROM believer_notes WHERE believer_id = ? AND deleted_at IS NULL AND occurred_at >= ? AND occurred_at <= ? AND believer_notes.church_id = ? ORDER BY occurred_at ASC',
        believerId,
        from,
        to,
        churchId,
    );

    const byDay = new Map<string, NoteDay>();
    for (const row of rows) {
        const day = byDay.get(row.occurred_at) ?? { date: row.occurred_at, kinds: [], total: 0 };
        if (!day.kinds.includes(row.kind as NoteKind)) day.kinds.push(row.kind as NoteKind);
        day.total += 1;
        byDay.set(row.occurred_at, day);
    }
    return [...byDay.values()].sort((one, other) => one.date.localeCompare(other.date));
}
