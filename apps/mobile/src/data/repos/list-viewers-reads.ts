import type { ListViewer } from '@navis/shared';
import { listDb, type ListContext } from './lists-context';

export async function readListViewers(context: ListContext): Promise<ListViewer[]> {
    const db = await listDb(context, true);
    const rows = await db.getAllAsync<
        Omit<ListViewer, 'isActive' | 'believerHasPhoto' | 'listIds'> & {
            isActive: number;
            photoKey: string | null;
        }
    >(
        `SELECT v.id, v.church_id AS churchId, v.believer_id AS believerId, v.username, v.label,
         v.is_active AS isActive, v.expires_at AS expiresAt, v.last_seen_at AS lastSeenAt,
         v.created_at AS createdAt, b.first_name || ' ' || b.last_name AS believerName, b.photo_key AS photoKey
         FROM list_viewers v LEFT JOIN believers b ON b.id = v.believer_id AND b.church_id = v.church_id AND b.deleted_at IS NULL
         WHERE v.church_id = ? AND v.deleted_at IS NULL ORDER BY v.label, v.id`,
        context.churchId,
    );
    const grants = await db.getAllAsync<{ viewerId: string; listId: string }>(
        `SELECT g.viewer_id AS viewerId, g.list_id AS listId FROM list_grants g
         JOIN lists l ON l.id = g.list_id JOIN list_viewers v ON v.id = g.viewer_id
         WHERE l.church_id = ? AND v.church_id = ? AND l.deleted_at IS NULL AND v.deleted_at IS NULL`,
        context.churchId,
        context.churchId,
    );
    return rows.map(({ photoKey, ...one }) => ({
        ...one,
        isActive: one.isActive === 1,
        believerHasPhoto: Boolean(photoKey),
        listIds: grants.filter((g) => g.viewerId === one.id).map((g) => g.listId),
    }));
}

export async function viewerCandidates(context: ListContext) {
    const db = await listDb(context, true);
    return db.getAllAsync<{ id: string; firstName: string; lastName: string }>(
        `SELECT id, first_name AS firstName, last_name AS lastName FROM believers
         WHERE church_id = ? AND deleted_at IS NULL ORDER BY search_name, id`,
        context.churchId,
    );
}
