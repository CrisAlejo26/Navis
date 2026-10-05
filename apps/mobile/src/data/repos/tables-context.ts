import { getDb, type LocalDb } from '../db';
import type { ListContext } from './lists-context';
export type TableContext = ListContext;

export async function tableDb(
    context: TableContext,
    manage = false,
    tableId?: string,
): Promise<LocalDb> {
    const db = await getDb();
    const church = await db.getFirstAsync<{ owner_id: string }>(
        `SELECT c.owner_id FROM churches c JOIN church_members m ON m.church_id = c.id
         WHERE m.church_id = ? AND m.user_id = ? AND c.deleted_at IS NULL AND m.deleted_at IS NULL`,
        context.churchId,
        context.userId,
    );
    if (!church || (manage && church.owner_id !== context.userId)) throw new Error('not-found');
    if (
        tableId &&
        !(await db.getFirstAsync(
            'SELECT id FROM custom_tables WHERE id = ? AND church_id = ? AND deleted_at IS NULL',
            tableId,
            context.churchId,
        ))
    )
        throw new Error('not-found');
    return db;
}
