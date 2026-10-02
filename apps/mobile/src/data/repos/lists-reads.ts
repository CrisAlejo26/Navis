import { listPublicFieldsSchema, type ListMember, type ListSummary } from '@navis/shared';
import { listDb, type ListContext } from './lists-context';

type ListRow = Omit<
    ListSummary,
    'isActive' | 'allowDownload' | 'publicFields' | 'hasCover' | 'initials' | 'recentViews'
> & { isActive: number; allowDownload: number; publicFields: string; coverKey: string | null };

export async function readLists(context: ListContext, activeOnly = true): Promise<ListSummary[]> {
    const db = await listDb(context);
    const rows = await db.getAllAsync<ListRow>(
        `SELECT l.id, l.church_id AS churchId, l.name, l.slug, l.description, l.accent, l.position,
         l.is_active AS isActive, l.visibility, l.share_token AS shareToken, l.shared_at AS sharedAt,
         l.share_expires_at AS shareExpiresAt, l.public_fields AS publicFields, l.allow_download AS allowDownload,
         l.cover_key AS coverKey, l.updated_at AS updatedAt,
         (SELECT COUNT(*) FROM list_members m JOIN believers b ON b.id = m.believer_id
          WHERE m.list_id = l.id AND b.church_id = l.church_id AND b.deleted_at IS NULL) AS memberCount
         FROM lists l WHERE l.church_id = ? AND l.deleted_at IS NULL ${activeOnly ? 'AND l.is_active = 1' : ''}
         ORDER BY l.position, l.created_at, l.id`,
        context.churchId,
    );
    const output: ListSummary[] = [];
    for (const row of rows) {
        const members = await readListMembers(context, row.id);
        output.push({
            ...row,
            isActive: row.isActive === 1,
            allowDownload: row.allowDownload === 1,
            publicFields: listPublicFieldsSchema.parse(JSON.parse(row.publicFields)),
            hasCover: Boolean(row.coverKey),
            initials: members
                .slice(0, 8)
                .map((one) => `${one.firstName[0] ?? ''}${one.lastName[0] ?? ''}`),
            recentViews: [],
        });
    }
    return output;
}

export async function readListMembers(context: ListContext, id: string): Promise<ListMember[]> {
    const db = await listDb(context, false, id);
    const rows = await db.getAllAsync<
        Omit<ListMember, 'ministries' | 'hasAccess' | 'hasPhoto'> & {
            photoKey: string | null;
            hasAccess: number;
        }
    >(
        `SELECT b.id AS believerId, b.first_name AS firstName, b.last_name AS lastName, m.position, m.note,
         b.congregation_id AS congregationId, c.name AS congregationName, c.accent AS congregationAccent,
         b.arrived_at AS arrivedAt, b.arrival_site AS arrivalSite, b.bible_readings AS bibleReadings,
         b.vivencias_readings AS vivenciasReadings, b.bible_institute_times AS bibleInstituteTimes, b.photo_key AS photoKey,
         EXISTS (SELECT 1 FROM list_viewers v JOIN list_grants g ON g.viewer_id = v.id
          WHERE v.believer_id = b.id AND v.church_id = b.church_id AND g.list_id = m.list_id
          AND v.deleted_at IS NULL AND v.is_active = 1 AND (v.expires_at IS NULL OR v.expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))) AS hasAccess
         FROM list_members m JOIN believers b ON b.id = m.believer_id
         LEFT JOIN congregations c ON c.id = b.congregation_id AND c.church_id = b.church_id AND c.deleted_at IS NULL
         WHERE m.list_id = ? AND b.church_id = ? AND b.deleted_at IS NULL ORDER BY m.position, b.id`,
        id,
        context.churchId,
    );
    const ministries = await db.getAllAsync<{ believerId: string; name: string }>(
        `SELECT bm.believer_id AS believerId, m.name FROM believer_ministries bm JOIN believers b ON b.id = bm.believer_id
         JOIN ministries m ON m.slug = bm.ministry AND m.church_id = b.church_id
         WHERE m.church_id = ? AND m.deleted_at IS NULL ORDER BY m.position`,
        context.churchId,
    );
    return rows.map(({ photoKey, hasAccess, ...row }) => ({
        ...row,
        hasAccess: hasAccess === 1,
        hasPhoto: Boolean(photoKey),
        ministries: ministries
            .filter((one) => one.believerId === row.believerId)
            .map((one) => one.name),
    }));
}

export async function listCandidates(context: ListContext, id: string) {
    const db = await listDb(context, false, id);
    return db.getAllAsync<{ id: string; firstName: string; lastName: string }>(
        `SELECT b.id, b.first_name AS firstName, b.last_name AS lastName FROM believers b
         WHERE b.church_id = ? AND b.deleted_at IS NULL AND NOT EXISTS
         (SELECT 1 FROM list_members m WHERE m.list_id = ? AND m.believer_id = b.id)
         ORDER BY b.search_name, b.id`,
        context.churchId,
        id,
    );
}
