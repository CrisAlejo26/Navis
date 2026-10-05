import { getDb, type LocalDb } from '../db';
import type { ListContext } from './lists-context';

export type TasksContext = ListContext;
export type ActivityKind = 'task' | 'habit';

/** Tasks are personal even inside a church: membership, church AND owner are required. */
export async function tasksDb(context: TasksContext): Promise<LocalDb> {
    const db = await getDb();
    const member = await db.getFirstAsync(
        `SELECT m.id FROM church_members m JOIN churches c ON c.id = m.church_id
         WHERE m.church_id = ? AND m.user_id = ? AND m.deleted_at IS NULL AND c.deleted_at IS NULL`,
        context.churchId,
        context.userId,
    );
    if (!member) throw new Error('not-found');
    return db;
}

export async function requireActivity(
    db: LocalDb,
    context: TasksContext,
    kind: ActivityKind,
    id: string,
): Promise<void> {
    const row = await db.getFirstAsync(
        `SELECT id FROM ${kind}s WHERE id = ? AND church_id = ? AND owner_id = ? AND deleted_at IS NULL`,
        id,
        context.churchId,
        context.userId,
    );
    if (!row) throw new Error('not-found');
}
