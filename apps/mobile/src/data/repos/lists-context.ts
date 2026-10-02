import { getDb, type LocalDb } from '../db';
import { assertInChurch } from '../church-scope';

export interface ListContext {
    churchId: string;
    userId: string;
}

/** Local church membership is the view permission; its owner manages and exports. */
export async function listDb(
    context: ListContext,
    manage = false,
    listId?: string,
): Promise<LocalDb> {
    const db = await getDb();
    const church = await db.getFirstAsync<{ owner_id: string }>(
        `SELECT c.owner_id FROM churches c JOIN church_members m ON m.church_id = c.id
         WHERE m.church_id = ? AND m.user_id = ? AND c.deleted_at IS NULL AND m.deleted_at IS NULL`,
        context.churchId,
        context.userId,
    );
    if (!church || (manage && church.owner_id !== context.userId)) throw new Error('not-found');
    if (listId) await assertInChurch(db, 'lists', listId, context.churchId);
    return db;
}
