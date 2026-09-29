import type { Emotion } from '@navis/shared';

import { getDb } from '../db';
import type { EmotionRow } from './dreams-sql';

/** Lo que cuelga de un sueño —sus emociones y sus audios—, pedido de una vez para toda una página. */

export function toEmotion(row: EmotionRow): Emotion {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        accent: row.accent,
        position: row.position,
    };
}

/** Las emociones de cada sueño, en el orden del vocabulario. */
export async function emotionsOf(ids: readonly string[]): Promise<Map<string, Emotion[]>> {
    const grouped = new Map<string, Emotion[]>();
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return grouped;

    const db = await getDb();
    const marks = unique.map(() => '?').join(', ');
    const rows = await db.getAllAsync<EmotionRow & { dream_id: string }>(
        `SELECT link.dream_id AS dream_id, e.id, e.slug, e.name, e.accent, e.position
     FROM dream_emotions link JOIN emotions e ON e.id = link.emotion_id
     WHERE e.deleted_at IS NULL AND link.dream_id IN (${marks})
     ORDER BY e.position ASC, e.name ASC`,
        ...unique,
    );
    for (const row of rows) {
        const list = grouped.get(row.dream_id) ?? [];
        list.push(toEmotion(row));
        grouped.set(row.dream_id, list);
    }
    return grouped;
}

export async function audioCountsOf(ids: readonly string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return counts;

    const db = await getDb();
    const marks = unique.map(() => '?').join(', ');
    const rows = await db.getAllAsync<{ dream_id: string; total: number }>(
        `SELECT dream_id, COUNT(*) AS total FROM dream_audios
     WHERE deleted_at IS NULL AND dream_id IN (${marks}) GROUP BY dream_id`,
        ...unique,
    );
    for (const row of rows) counts.set(row.dream_id, row.total);
    return counts;
}
