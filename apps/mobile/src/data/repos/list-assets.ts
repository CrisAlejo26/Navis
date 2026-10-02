import { listDb, type ListContext } from './lists-context';

export async function readListAssets(
    context: ListContext,
    id: string,
): Promise<{ cover: string | null; photos: Record<string, string> }> {
    const db = await listDb(context, true, id);
    const list = await db.getFirstAsync<{ cover_key: string | null }>(
        'SELECT cover_key FROM lists WHERE id = ? AND church_id = ?',
        id,
        context.churchId,
    );
    const rows = await db.getAllAsync<{ id: string; photo_key: string }>(
        `SELECT b.id, b.photo_key FROM list_members m JOIN believers b ON b.id = m.believer_id
         WHERE m.list_id = ? AND b.church_id = ? AND b.deleted_at IS NULL AND b.photo_key IS NOT NULL`,
        id,
        context.churchId,
    );
    return {
        cover: list?.cover_key ?? null,
        photos: Object.fromEntries(rows.map((row) => [row.id, row.photo_key])),
    };
}
