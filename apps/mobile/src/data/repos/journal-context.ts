import type { LocalDb } from '../local-db';
import { listDb, type ListContext } from './lists-context';
export type JournalContext = ListContext;
export async function journalDb(
    context: JournalContext,
    manage = false,
    id?: string,
): Promise<LocalDb> {
    const db = await listDb(context, manage);
    if (
        id &&
        !(await db.getFirstAsync(
            'SELECT id FROM journal_entries WHERE id = ? AND church_id = ? AND deleted_at IS NULL',
            id,
            context.churchId,
        ))
    )
        throw new Error('not-found');
    return db;
}
