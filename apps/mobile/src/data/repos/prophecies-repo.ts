import {
    createProphecySchema,
    summarize,
    toSearchName,
    updateProphecySchema,
    type CreateProphecyInput,
    type Paginated,
    type PropheciesQuery,
    type PropheciesStats,
    type Prophecy,
    type ProphecyListItem,
    type UpdateProphecyInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { todayIso } from './dashboard-repo';
import {
    fulfillmentDaysOf,
    orderClause,
    toListItem,
    whereFilters,
    type ProphecyRow,
} from './prophecies-sql';

/**
 * Las profecías **en local** (docs/profecias-movil-plan.md §4.3): el mismo
 * contrato que `PropheciesService`/`PropheciesPageService` de la API, resuelto
 * con SQL directo sobre SQLite del teléfono.
 *
 * Es la primera tabla local **sin `church_id`** (RFC 0004 D1): todo método
 * exige `ownerId` como primer parámetro, y es la única barrera de acceso —
 * igual que `PropheciesRepository` en la API.
 */

const PAGE_DEFAULT = 20;

const PROPHECY_COLUMNS =
    'id, title, body, received_at, fulfilled_at, last_fulfillment_at, created_at';

export async function listProphecies(
    ownerId: string,
    query: PropheciesQuery & { limit?: number; offset?: number },
): Promise<Paginated<ProphecyListItem>> {
    const db = await getDb();
    const today = todayIso();
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? PAGE_DEFAULT;
    const offset = query.offset ?? (page - 1) * limit;

    const { clauses, params } = whereFilters(ownerId, query, today);
    const where = clauses.join(' AND ');
    const orderBy = orderClause(query.sort, query.order);

    const total =
        (
            await db.getFirstAsync<{ total: number }>(
                `SELECT COUNT(*) AS total FROM prophecies WHERE ${where}`,
                ...params,
            )
        )?.total ?? 0;
    const rows = await db.getAllAsync<ProphecyRow>(
        `SELECT ${PROPHECY_COLUMNS} FROM prophecies WHERE ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset,
    );

    const days = await fulfillmentDaysOf(rows.map((row) => row.id));
    return {
        items: rows.map((row) => toListItem(row, today, days.get(row.id) ?? [])),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}

export async function prophecyStats(ownerId: string): Promise<PropheciesStats> {
    const db = await getDb();
    const rows = await db.getAllAsync<ProphecyRow>(
        `SELECT ${PROPHECY_COLUMNS} FROM prophecies WHERE owner_id = ? AND deleted_at IS NULL`,
        ownerId,
    );
    return summarize(
        rows.map((row) => ({
            id: row.id,
            title: row.title,
            receivedAt: row.received_at,
            fulfilledAt: row.fulfilled_at,
            lastFulfillmentAt: row.last_fulfillment_at,
        })),
        todayIso(),
    );
}

export async function findProphecy(ownerId: string, id: string): Promise<Prophecy | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<ProphecyRow>(
        `SELECT ${PROPHECY_COLUMNS} FROM prophecies WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`,
        id,
        ownerId,
    );
    if (!row) return null;

    const fulfillments = await db.getAllAsync<{
        id: string;
        prophecy_id: string;
        text: string;
        occurred_at: string;
        created_at: string;
    }>(
        'SELECT id, prophecy_id, text, occurred_at, created_at FROM prophecy_fulfillments WHERE prophecy_id = ? AND owner_id = ? AND deleted_at IS NULL ORDER BY occurred_at DESC, created_at DESC',
        id,
        ownerId,
    );

    return {
        id: row.id,
        title: row.title,
        body: row.body,
        receivedAt: row.received_at,
        fulfilledAt: row.fulfilled_at,
        lastFulfillmentAt: row.last_fulfillment_at,
        createdAt: row.created_at,
        fulfillments: fulfillments.map((one) => ({
            id: one.id,
            prophecyId: one.prophecy_id,
            text: one.text,
            occurredAt: one.occurred_at,
            createdAt: one.created_at,
        })),
    };
}

/** D7: no puede haberse cumplido antes de recibirse. La misma `ensureOrder` de la API. */
function ensureOrder(receivedAt: string, fulfilledAt: string | null): void {
    if (fulfilledAt && fulfilledAt < receivedAt) {
        throw new Error('No puede haberse cumplido antes de recibirse');
    }
}

export async function createProphecy(ownerId: string, input: CreateProphecyInput): Promise<string> {
    const parsed = createProphecySchema.parse(input);
    const db = await getDb();
    const id = newId();
    const now = nowIso();
    await db.runAsync(
        `INSERT INTO prophecies (id, created_at, updated_at, deleted_at, owner_id, title, body,
       search_text, received_at, fulfilled_at, last_fulfillment_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL)`,
        id,
        now,
        now,
        ownerId,
        parsed.title,
        parsed.body,
        toSearchName(`${parsed.title} ${parsed.body}`),
        parsed.receivedAt,
        parsed.fulfilledAt ?? null,
    );
    return id;
}

export async function updateProphecy(
    ownerId: string,
    id: string,
    input: UpdateProphecyInput,
): Promise<void> {
    const parsed = updateProphecySchema.parse(input);
    const db = await getDb();
    const current = await db.getFirstAsync<{
        title: string;
        body: string;
        received_at: string;
        fulfilled_at: string | null;
    }>(
        'SELECT title, body, received_at, fulfilled_at FROM prophecies WHERE id = ? AND owner_id = ? AND deleted_at IS NULL',
        id,
        ownerId,
    );
    if (!current) return;

    const title = parsed.title ?? current.title;
    const body = parsed.body ?? current.body;
    const receivedAt = parsed.receivedAt ?? current.received_at;
    const fulfilledAt =
        parsed.fulfilledAt !== undefined ? parsed.fulfilledAt : current.fulfilled_at;
    ensureOrder(receivedAt, fulfilledAt);

    await db.runAsync(
        `UPDATE prophecies SET title = ?, body = ?, search_text = ?, received_at = ?, fulfilled_at = ?,
       updated_at = ? WHERE id = ? AND owner_id = ?`,
        title,
        body,
        toSearchName(`${title} ${body}`),
        receivedAt,
        fulfilledAt,
        nowIso(),
        id,
        ownerId,
    );
}

export async function deleteProphecy(ownerId: string, id: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'UPDATE prophecies SET deleted_at = ?, updated_at = ? WHERE id = ? AND owner_id = ?',
        nowIso(),
        nowIso(),
        id,
        ownerId,
    );
}
