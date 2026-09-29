import {
    extractTeachingBodyText,
    parseTeachingBody,
    toExcerpt,
    toSearchName,
    type TeachingListItem,
    type TeachingSortField,
    type TeachingsQuery,
} from '@navis/shared';

import type { SQLiteBindValue } from 'expo-sqlite';

/** El SQL que comparte `teachings-repo.ts`: filtros, orden y la fila de la base. */

export interface TeachingRow {
    id: string;
    title: string;
    body_json: string;
    received_at: string;
    created_at: string;
}

export const TEACHING_COLUMNS = 'id, title, body_json, received_at, created_at';

const SORT_SQL: Record<TeachingSortField, string> = {
    received: 'received_at',
    title: 'title COLLATE NOCASE',
};

export function orderClause(
    sort: TeachingSortField | undefined,
    order: 'asc' | 'desc' | undefined,
): string {
    const dir = order === 'asc' ? 'ASC' : 'DESC';
    return `${SORT_SQL[sort ?? 'received']} ${dir}, id ${dir}`;
}

export function whereFilters(
    ownerId: string,
    query: TeachingsQuery,
): { clauses: string[]; params: SQLiteBindValue[] } {
    const clauses = ['owner_id = ?', 'deleted_at IS NULL'];
    const params: SQLiteBindValue[] = [ownerId];

    if (query.search) {
        clauses.push('search_text LIKE ?');
        params.push(`%${toSearchName(query.search)}%`);
    }
    return { clauses, params };
}

/** La fila de listado: un extracto en texto plano y la cuenta de la checklist, no el árbol. */
export function toListItem(row: TeachingRow): TeachingListItem {
    const { text, checklist } = extractTeachingBodyText(parseTeachingBody(row.body_json));
    return {
        id: row.id,
        title: row.title,
        excerpt: toExcerpt(text),
        receivedAt: row.received_at,
        checklist,
    };
}
