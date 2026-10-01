import { nowIso } from '../db';
import type { LocalDb } from '../local-db';
export async function recomputeLastNote(
    db: LocalDb,
    believerId: string,
    churchId: string,
): Promise<void> {
    await db.runAsync(
        `UPDATE believers SET last_note_at = (
       SELECT MAX(occurred_at) FROM believer_notes WHERE believer_id = ? AND church_id = ? AND deleted_at IS NULL
     ), updated_at = ? WHERE id = ? AND church_id = ?`,
        believerId,
        churchId,
        nowIso(),
        believerId,
        churchId,
    );
}
