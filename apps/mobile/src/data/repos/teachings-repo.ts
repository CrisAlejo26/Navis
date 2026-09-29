import {
    createTeachingSchema,
    parseTeachingBody,
    summarizeTeachings,
    toTeachingSearchText,
    updateTeachingSchema,
    type CreateTeachingInput,
    type Paginated,
    type Teaching,
    type TeachingListItem,
    type TeachingsQuery,
    type TeachingsStats,
    type UpdateTeachingInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { todayIso } from './dashboard-repo';
import {
    orderClause,
    TEACHING_COLUMNS,
    toListItem,
    whereFilters,
    type TeachingRow,
} from './teachings-sql';

/**
 * Las enseñanzas **en local** (docs/planes/pendientes/ensenanzas-movil-plan.md §4.3): el
 * mismo contrato que `TeachingsService`/`TeachingsPageService` de la API,
 * resuelto con SQL directo sobre el SQLite del teléfono.
 *
 * Como profecías, no lleva `church_id` (RFC 0022): todo método exige `ownerId`
 * como primer parámetro y es la única barrera de acceso.
 */

const PAGE_DEFAULT = 20;

export async function listTeachings(
    ownerId: string,
    query: TeachingsQuery,
): Promise<Paginated<TeachingListItem>> {
    const db = await getDb();
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? PAGE_DEFAULT;

    const { clauses, params } = whereFilters(ownerId, query);
    const where = clauses.join(' AND ');

    const total =
        (
            await db.getFirstAsync<{ total: number }>(
                `SELECT COUNT(*) AS total FROM teachings WHERE ${where}`,
                ...params,
            )
        )?.total ?? 0;
    const rows = await db.getAllAsync<TeachingRow>(
        `SELECT ${TEACHING_COLUMNS} FROM teachings WHERE ${where} ORDER BY ${orderClause(query.sort, query.order)} LIMIT ? OFFSET ?`,
        ...params,
        limit,
        (page - 1) * limit,
    );

    return {
        items: rows.map(toListItem),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}

export async function teachingsStats(ownerId: string): Promise<TeachingsStats> {
    const db = await getDb();
    const rows = await db.getAllAsync<{ received_at: string; body_json: string }>(
        'SELECT received_at, body_json FROM teachings WHERE owner_id = ? AND deleted_at IS NULL',
        ownerId,
    );
    return summarizeTeachings(
        rows.map((row) => ({ receivedAt: row.received_at, bodyJson: row.body_json })),
        todayIso(),
    );
}

export async function findTeaching(ownerId: string, id: string): Promise<Teaching | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<TeachingRow>(
        `SELECT ${TEACHING_COLUMNS} FROM teachings WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`,
        id,
        ownerId,
    );
    if (!row) return null;
    return {
        id: row.id,
        title: row.title,
        body: parseTeachingBody(row.body_json),
        receivedAt: row.received_at,
        createdAt: row.created_at,
    };
}

export async function createTeaching(ownerId: string, input: CreateTeachingInput): Promise<string> {
    const parsed = createTeachingSchema.parse(input);
    const db = await getDb();
    const id = newId();
    const now = nowIso();
    await db.runAsync(
        `INSERT INTO teachings (id, created_at, updated_at, deleted_at, owner_id, title, body_json,
       search_text, received_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)`,
        id,
        now,
        now,
        ownerId,
        parsed.title,
        JSON.stringify(parsed.body),
        toTeachingSearchText(parsed.title, parsed.body),
        parsed.receivedAt,
    );
    return id;
}

export async function updateTeaching(
    ownerId: string,
    id: string,
    input: UpdateTeachingInput,
): Promise<void> {
    const parsed = updateTeachingSchema.parse(input);
    const current = await findTeaching(ownerId, id);
    if (!current) return;

    const title = parsed.title ?? current.title;
    const body = parsed.body ?? current.body;
    const db = await getDb();
    await db.runAsync(
        `UPDATE teachings SET title = ?, body_json = ?, search_text = ?, received_at = ?,
       updated_at = ? WHERE id = ? AND owner_id = ?`,
        title,
        JSON.stringify(body),
        toTeachingSearchText(title, body),
        parsed.receivedAt ?? current.receivedAt,
        nowIso(),
        id,
        ownerId,
    );
}

export async function deleteTeaching(ownerId: string, id: string): Promise<void> {
    const db = await getDb();
    const now = nowIso();
    await db.runAsync(
        'UPDATE teachings SET deleted_at = ?, updated_at = ? WHERE id = ? AND owner_id = ?',
        now,
        now,
        id,
        ownerId,
    );
}
