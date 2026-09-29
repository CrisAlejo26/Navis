import {
    dreamState,
    toExcerpt,
    toSearchName,
    type DreamListItem,
    type DreamSortField,
    type DreamState,
    type DreamsQuery,
    type Emotion,
} from '@navis/shared';
import type { SQLiteBindValue } from 'expo-sqlite';

/** El SQL que comparten `dreams-repo.ts` y `emotions-repo.ts`: filtros, orden y filas. */

export interface DreamRow {
    id: string;
    title: string | null;
    body: string;
    dreamed_at: string;
    interpretation: string | null;
    fulfilled_at: string | null;
    fulfillment_meaning: string | null;
    created_at: string;
}

export interface EmotionRow {
    id: string;
    slug: string | null;
    name: string | null;
    accent: string;
    position: number;
}

export const DREAM_COLUMNS =
    'id, title, body, dreamed_at, interpretation, fulfilled_at, fulfillment_meaning, created_at';

/** Cómo se traduce cada estado a SQL (D8): traducción propia de este motor. */
const STATE_SQL: Record<DreamState, string> = {
    apuntado: "fulfilled_at IS NULL AND (interpretation IS NULL OR interpretation = '')",
    estudio: "fulfilled_at IS NULL AND interpretation IS NOT NULL AND interpretation <> ''",
    cumplido: 'fulfilled_at IS NOT NULL',
};

const SORT_SQL: Record<DreamSortField, string> = {
    dreamed: 'dreamed_at',
    fulfilled: 'fulfilled_at',
    title: 'title',
};

export function orderClause(
    sort: DreamSortField | undefined,
    order: 'asc' | 'desc' | undefined,
): string {
    const dir = order === 'asc' ? 'ASC' : 'DESC';
    return `${SORT_SQL[sort ?? 'dreamed']} ${dir}, id ${dir}`;
}

export function whereFilters(
    ownerId: string,
    query: DreamsQuery,
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
    if (query.from) {
        clauses.push('dreamed_at >= ?');
        params.push(query.from);
    }
    if (query.to) {
        clauses.push('dreamed_at <= ?');
        params.push(query.to);
    }
    if (query.year !== undefined) {
        clauses.push('dreamed_at >= ? AND dreamed_at <= ?');
        params.push(`${String(query.year)}-01-01`, `${String(query.year)}-12-31`);
    }
    // Los vacíos se filtran antes de consultar (CLAUDE.md, «IN ('')»).
    const emotions = (query.emotion ?? []).filter((id) => id !== '');
    if (emotions.length > 0) {
        const marks = emotions.map(() => '?').join(', ');
        clauses.push(`id IN (SELECT dream_id FROM dream_emotions WHERE emotion_id IN (${marks}))`);
        params.push(...emotions);
    }
    return { clauses, params };
}

export function toListItem(row: DreamRow, emotions: Emotion[], audiosCount: number): DreamListItem {
    const progress = { interpretation: row.interpretation, fulfilledAt: row.fulfilled_at };
    return {
        id: row.id,
        title: row.title,
        excerpt: toExcerpt(row.body),
        dreamedAt: row.dreamed_at,
        fulfilledAt: row.fulfilled_at,
        state: dreamState(progress),
        hasInterpretation: Boolean(row.interpretation && row.interpretation.trim() !== ''),
        audiosCount,
        emotions,
    };
}
