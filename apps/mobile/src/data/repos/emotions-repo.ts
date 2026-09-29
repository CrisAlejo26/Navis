import {
    createEmotionSchema,
    updateEmotionSchema,
    type CreateEmotionInput,
    type EmotionWithCount,
    type UpdateEmotionInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { toEmotion } from './dreams-relations';
import type { EmotionRow } from './dreams-sql';

/**
 * El vocabulario de emociones **en local** (RFC 0005 §5.2). Las de serie son
 * las de `owner_id` nulo y no se tocan (D6); las propias llevan el dueño, que
 * es la única barrera de acceso, como en la API.
 */

/** Las de serie y las de este dueño, con cuántos sueños vivos las llevan. */
export async function listEmotions(ownerId: string): Promise<EmotionWithCount[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<EmotionRow & { total: number }>(
        `SELECT e.id, e.slug, e.name, e.accent, e.position,
       (SELECT COUNT(*) FROM dream_emotions link JOIN dreams d ON d.id = link.dream_id
         WHERE link.emotion_id = e.id AND d.owner_id = ? AND d.deleted_at IS NULL) AS total
     FROM emotions e
     WHERE e.deleted_at IS NULL AND (e.owner_id IS NULL OR e.owner_id = ?)
     ORDER BY e.owner_id IS NOT NULL, e.position ASC, e.name ASC`,
        ownerId,
        ownerId,
    );
    return rows.map((row) => ({ ...toEmotion(row), count: row.total }));
}

export async function createEmotion(ownerId: string, input: CreateEmotionInput): Promise<string> {
    const parsed = createEmotionSchema.parse(input);
    const db = await getDb();
    const id = newId();
    const now = nowIso();
    await db.runAsync(
        'INSERT INTO emotions (id, created_at, updated_at, deleted_at, owner_id, slug, name, accent, position) VALUES (?, ?, ?, NULL, ?, NULL, ?, ?, 0)',
        id,
        now,
        now,
        ownerId,
        parsed.name,
        parsed.accent,
    );
    return id;
}

/** Solo las propias: una de serie (o ajena) no se encuentra, y se avisa. */
async function requireOwn(ownerId: string, id: string): Promise<{ name: string; accent: string }> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ name: string | null; accent: string }>(
        'SELECT name, accent FROM emotions WHERE id = ? AND owner_id = ? AND deleted_at IS NULL',
        id,
        ownerId,
    );
    if (!row) throw new Error('Las emociones de serie no se pueden cambiar');
    return { name: row.name ?? '', accent: row.accent };
}

export async function updateEmotion(
    ownerId: string,
    id: string,
    input: UpdateEmotionInput,
): Promise<void> {
    const parsed = updateEmotionSchema.parse(input);
    const current = await requireOwn(ownerId, id);
    const db = await getDb();
    await db.runAsync(
        'UPDATE emotions SET name = ?, accent = ?, updated_at = ? WHERE id = ? AND owner_id = ?',
        parsed.name ?? current.name,
        parsed.accent ?? current.accent,
        nowIso(),
        id,
        ownerId,
    );
}

/** Borrar una propia no borra los sueños: desaparece de la unión y ellos se quedan (D6). */
export async function deleteEmotion(ownerId: string, id: string): Promise<void> {
    await requireOwn(ownerId, id);
    const db = await getDb();
    await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM dream_emotions WHERE emotion_id = ?', id);
        await db.runAsync(
            'UPDATE emotions SET deleted_at = ?, updated_at = ? WHERE id = ? AND owner_id = ?',
            nowIso(),
            nowIso(),
            id,
            ownerId,
        );
    });
}
