import {
    summarizeDreams,
    type Dream,
    type DreamEmotionCount,
    type DreamListItem,
    type DreamsQuery,
    type DreamsStats,
    type Paginated,
} from '@navis/shared';

import { getDb, type LocalDb } from '../db';
import { todayIso } from './dashboard-repo';
import { audiosOfDream, type LocalDreamAudio } from './dream-audios-repo';
import {
    DREAM_COLUMNS,
    orderClause,
    toListItem,
    whereFilters,
    type DreamRow,
    type EmotionRow,
} from './dreams-sql';
import { audioCountsOf, emotionsOf, toEmotion } from './dreams-relations';

/**
 * Los sueños **en local** (docs/planes/pendientes/suenos-movil-plan.md §3.3): el
 * mismo contrato que `DreamsService`/`DreamsPageService` de la API, con SQL
 * directo sobre SQLite. Como profecías, no llevan `church_id` (RFC 0005 D1):
 * todo método exige `ownerId`, y es la única barrera de acceso.
 */

const PAGE_DEFAULT = 20;

/** El sueño que devuelve este repo: el del contrato, con los audios localizables. */
export type LocalDream = Omit<Dream, 'audios'> & { audios: LocalDreamAudio[] };

export async function listDreams(
    ownerId: string,
    query: DreamsQuery & { limit?: number; offset?: number },
): Promise<Paginated<DreamListItem>> {
    const db = await getDb();
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? PAGE_DEFAULT;
    const offset = query.offset ?? (page - 1) * limit;

    const { clauses, params } = whereFilters(ownerId, query);
    const where = clauses.join(' AND ');
    const total =
        (
            await db.getFirstAsync<{ total: number }>(
                `SELECT COUNT(*) AS total FROM dreams WHERE ${where}`,
                ...params,
            )
        )?.total ?? 0;
    const rows = await db.getAllAsync<DreamRow>(
        `SELECT ${DREAM_COLUMNS} FROM dreams WHERE ${where} ORDER BY ${orderClause(query.sort, query.order)} LIMIT ? OFFSET ?`,
        ...params,
        limit,
        offset,
    );

    const ids = rows.map((row) => row.id);
    const [emotions, audios] = await Promise.all([emotionsOf(ids), audioCountsOf(ids)]);
    return {
        items: rows.map((row) =>
            toListItem(row, emotions.get(row.id) ?? [], audios.get(row.id) ?? 0),
        ),
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
    };
}

/** El mapa de emociones: solo las que se han usado, con su color (§7.3 de la RFC). */
async function emotionCounts(db: LocalDb, ownerId: string): Promise<DreamEmotionCount[]> {
    const rows = await db.getAllAsync<EmotionRow & { total: number }>(
        `SELECT e.id, e.slug, e.name, e.accent, e.position, COUNT(*) AS total
     FROM dream_emotions link
     JOIN dreams d ON d.id = link.dream_id AND d.owner_id = ? AND d.deleted_at IS NULL
     JOIN emotions e ON e.id = link.emotion_id AND e.deleted_at IS NULL
     GROUP BY e.id`,
        ownerId,
    );
    return rows.map((row) => ({ ...toEmotion(row), count: row.total }));
}

export async function dreamsStats(ownerId: string): Promise<DreamsStats> {
    const db = await getDb();
    const rows = await db.getAllAsync<DreamRow>(
        `SELECT ${DREAM_COLUMNS} FROM dreams WHERE owner_id = ? AND deleted_at IS NULL`,
        ownerId,
    );
    return summarizeDreams(
        rows.map((row) => ({
            id: row.id,
            title: row.title,
            dreamedAt: row.dreamed_at,
            fulfilledAt: row.fulfilled_at,
        })),
        todayIso(),
        await emotionCounts(db, ownerId),
    );
}

export async function findDream(ownerId: string, id: string): Promise<LocalDream | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<DreamRow>(
        `SELECT ${DREAM_COLUMNS} FROM dreams WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`,
        id,
        ownerId,
    );
    if (!row) return null;

    const emotions = await emotionsOf([id]);
    return {
        id: row.id,
        title: row.title,
        body: row.body,
        dreamedAt: row.dreamed_at,
        interpretation: row.interpretation,
        fulfilledAt: row.fulfilled_at,
        fulfillmentMeaning: row.fulfillment_meaning,
        emotions: emotions.get(id) ?? [],
        audios: await audiosOfDream(id),
        createdAt: row.created_at,
    };
}

export { createDream, deleteDream, updateDream } from './dreams-writes';
