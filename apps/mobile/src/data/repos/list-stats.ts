import { listDb, type ListContext } from './lists-context';

export type CompositionRow = { id: string; name: string; count: number };
export async function readListStats(context: ListContext, id: string) {
    const db = await listDb(context, false, id);
    const congregations = await db.getAllAsync<CompositionRow>(
        `SELECT c.id, c.name, COUNT(*) AS count FROM list_members lm JOIN believers b ON b.id = lm.believer_id
         JOIN congregations c ON c.id = b.congregation_id AND c.church_id = b.church_id
         WHERE lm.list_id = ? AND b.church_id = ? AND b.deleted_at IS NULL AND c.deleted_at IS NULL GROUP BY c.id ORDER BY count DESC, c.name`,
        id,
        context.churchId,
    );
    async function catalog(
        kind: 'gifts' | 'ministries',
        links: 'believer_gifts' | 'believer_ministries',
        column: 'gift_id' | 'ministry',
    ) {
        return db.getAllAsync<CompositionRow>(
            `SELECT c.id, c.name, COUNT(DISTINCT b.id) AS count FROM list_members lm JOIN believers b ON b.id = lm.believer_id
             JOIN ${links} bl ON bl.believer_id = b.id JOIN ${kind} c ON c.${kind === 'ministries' ? 'slug' : 'id'} = bl.${column}
             WHERE lm.list_id = ? AND b.church_id = ? AND b.deleted_at IS NULL AND c.church_id = b.church_id AND c.deleted_at IS NULL GROUP BY c.id ORDER BY count DESC, c.name`,
            id,
            context.churchId,
        );
    }
    const ministries = await catalog('ministries', 'believer_ministries', 'ministry');
    const gifts = await catalog('gifts', 'believer_gifts', 'gift_id');
    const overlap = await db.getAllAsync<CompositionRow>(
        `SELECT l.id, l.name, COUNT(DISTINCT b.id) AS count FROM list_members own
         JOIN believers b ON b.id = own.believer_id JOIN list_members other ON other.believer_id = own.believer_id
         JOIN lists l ON l.id = other.list_id WHERE own.list_id = ? AND l.id <> ? AND l.church_id = ?
         AND b.church_id = l.church_id AND l.deleted_at IS NULL AND l.is_active = 1 AND b.deleted_at IS NULL
         GROUP BY l.id ORDER BY count DESC, l.name`,
        id,
        id,
        context.churchId,
    );
    return { congregations, ministries, gifts, overlap };
}
