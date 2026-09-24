import {
    prophecyState,
    toExcerpt,
    toSearchName,
    waitingDays,
    windowStart,
    type PropheciesQuery,
    type ProphecyListItem,
    type ProphecySortField,
    type ProphecyState,
} from '@navis/shared';

import type { SQLiteBindValue } from 'expo-sqlite';

import { getDb } from '../db';

/** El SQL que comparte `prophecies-repo.ts`: filtros, orden y la fila de la base. */

export interface ProphecyRow {
    id: string;
    title: string;
    body: string;
    received_at: string;
    fulfilled_at: string | null;
    last_fulfillment_at: string | null;
    created_at: string;
}

/** Cómo se traduce cada estado a SQL (D3): traducción propia de este motor. */
const STATE_SQL: Record<ProphecyState, string> = {
    espera: 'fulfilled_at IS NULL AND last_fulfillment_at IS NULL',
    camino: 'fulfilled_at IS NULL AND last_fulfillment_at IS NOT NULL',
    cumplida: 'fulfilled_at IS NOT NULL',
};

const SORT_SQL: Record<ProphecySortField, string> = {
    received: 'received_at',
    fulfilled: 'fulfilled_at',
    title: 'title',
    lastMovement: 'COALESCE(last_fulfillment_at, received_at)',
};

export function orderClause(
    sort: ProphecySortField | undefined,
    order: 'asc' | 'desc' | undefined,
): string {
    const dir = order === 'asc' ? 'ASC' : 'DESC';
    return `${SORT_SQL[sort ?? 'received']} ${dir}, id ${dir}`;
}

export function whereFilters(
    ownerId: string,
    query: PropheciesQuery,
    today: string,
): { clauses: string[]; params: SQLiteBindValue[] } {
    const clauses = ['owner_id = ?', 'deleted_at IS NULL'];
    const params: SQLiteBindValue[] = [ownerId];

    if (query.search) {
        clauses.push('search_text LIKE ?');
        params.push(`%${toSearchName(query.search)}%`);
    }
    const states = query.state ?? [];
    if (states.length > 0) {
        clauses.push(`(${states.map((state) => `(${STATE_SQL[state]})`).join(' OR ')})`);
    }
    const from = query.from ?? windowStart(query.window ?? 'all', today);
    if (from) {
        clauses.push('received_at >= ?');
        params.push(from);
    }
    if (query.to) {
        clauses.push('received_at <= ?');
        params.push(query.to);
    }
    return { clauses, params };
}

/** Los días de cada cumplimiento parcial, de más antiguo a más reciente, por profecía. */
export async function fulfillmentDaysOf(ids: readonly string[]): Promise<Map<string, string[]>> {
    const grouped = new Map<string, string[]>();
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return grouped;

    const db = await getDb();
    const marks = unique.map(() => '?').join(', ');
    const rows = await db.getAllAsync<{ prophecy_id: string; occurred_at: string }>(
        `SELECT prophecy_id, occurred_at FROM prophecy_fulfillments
     WHERE deleted_at IS NULL AND prophecy_id IN (${marks}) ORDER BY occurred_at ASC`,
        ...unique,
    );
    for (const row of rows) {
        const days = grouped.get(row.prophecy_id) ?? [];
        days.push(row.occurred_at);
        grouped.set(row.prophecy_id, days);
    }
    return grouped;
}

export function toListItem(
    row: ProphecyRow,
    today: string,
    fulfillmentDays: readonly string[],
): ProphecyListItem {
    const progress = {
        receivedAt: row.received_at,
        fulfilledAt: row.fulfilled_at,
        lastFulfillmentAt: row.last_fulfillment_at,
    };
    return {
        id: row.id,
        title: row.title,
        excerpt: toExcerpt(row.body),
        ...progress,
        state: prophecyState(progress),
        waitingDays: waitingDays(progress, today),
        fulfillmentsCount: fulfillmentDays.length,
        fulfillmentDays: [...fulfillmentDays],
    };
}
