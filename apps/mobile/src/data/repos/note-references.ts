import type { LocalDb } from '../local-db';
import { assertInChurch } from '../church-scope';

export async function assertNoteBeliever(
    db: LocalDb,
    noteId: string,
    believerId: string,
    churchId: string,
): Promise<void> {
    await assertInChurch(db, 'believers', believerId, churchId);
    const note = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM believer_notes WHERE id = ? AND believer_id = ? AND church_id = ? AND deleted_at IS NULL',
        noteId,
        believerId,
        churchId,
    );
    if (!note) throw new Error('not-found');
}
