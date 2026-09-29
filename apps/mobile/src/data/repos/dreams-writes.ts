import {
    createDreamSchema,
    toSearchName,
    updateDreamSchema,
    type CreateDreamInput,
    type UpdateDreamInput,
} from '@navis/shared';

import { getDb, newId, nowIso, type LocalDb } from '../db';
import { removeAudiosOf } from './dream-audios-repo';
import { DREAM_COLUMNS, type DreamRow } from './dreams-sql';

/**
 * Las escrituras de sueños **en local**: crear, cambiar y borrar. Las lecturas
 * están en `dreams-repo.ts`, que las reexporta para que quien use el repositorio
 * lo importe todo de un sitio.
 */

function blankToNull(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed ? trimmed : null;
}

/** La misma normalización con la que guarda la API (`toSearchText`). */
function searchText(title: string | null, body: string, interpretation: string | null): string {
    return toSearchName([title, body, interpretation].filter(Boolean).join(' '));
}

/** D12: no puede haberse cumplido antes de soñarse. La misma `ensureOrder` de la API. */
function ensureOrder(dreamedAt: string, fulfilledAt: string | null): void {
    if (fulfilledAt && fulfilledAt < dreamedAt) {
        throw new Error('No puede haberse cumplido antes de soñarse');
    }
}

/** Solo las emociones que puede usar: las de serie y las suyas. Lo demás se descarta. */
async function setEmotions(
    db: LocalDb,
    ownerId: string,
    dreamId: string,
    emotionIds: readonly string[] | undefined,
): Promise<void> {
    if (emotionIds === undefined) return;

    const wanted = [...new Set(emotionIds)].filter(Boolean);
    let usable: string[] = [];
    if (wanted.length > 0) {
        const marks = wanted.map(() => '?').join(', ');
        usable = (
            await db.getAllAsync<{ id: string }>(
                `SELECT id FROM emotions WHERE deleted_at IS NULL AND (owner_id IS NULL OR owner_id = ?) AND id IN (${marks})`,
                ownerId,
                ...wanted,
            )
        ).map((row) => row.id);
    }

    await db.runAsync('DELETE FROM dream_emotions WHERE dream_id = ?', dreamId);
    const now = nowIso();
    for (const emotionId of usable) {
        await db.runAsync(
            'INSERT INTO dream_emotions (id, created_at, updated_at, deleted_at, dream_id, emotion_id) VALUES (?, ?, ?, NULL, ?, ?)',
            newId(),
            now,
            now,
            dreamId,
            emotionId,
        );
    }
}

export async function createDream(ownerId: string, input: CreateDreamInput): Promise<string> {
    const parsed = createDreamSchema.parse(input);
    const db = await getDb();
    const id = newId();
    const now = nowIso();
    const title = blankToNull(parsed.title);
    const interpretation = blankToNull(parsed.interpretation);

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `INSERT INTO dreams (id, created_at, updated_at, deleted_at, owner_id, title, body,
         search_text, dreamed_at, interpretation, fulfilled_at, fulfillment_meaning)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
            id,
            now,
            now,
            ownerId,
            title,
            parsed.body,
            searchText(title, parsed.body, interpretation),
            parsed.dreamedAt,
            interpretation,
        );
        await setEmotions(db, ownerId, id, parsed.emotionIds);
    });
    return id;
}

export async function updateDream(
    ownerId: string,
    id: string,
    input: UpdateDreamInput,
): Promise<void> {
    const parsed = updateDreamSchema.parse(input);
    const db = await getDb();
    const current = await db.getFirstAsync<DreamRow>(
        `SELECT ${DREAM_COLUMNS} FROM dreams WHERE id = ? AND owner_id = ? AND deleted_at IS NULL`,
        id,
        ownerId,
    );
    if (!current) return;

    const title = parsed.title !== undefined ? blankToNull(parsed.title) : current.title;
    const body = parsed.body ?? current.body;
    const interpretation =
        parsed.interpretation !== undefined
            ? blankToNull(parsed.interpretation)
            : current.interpretation;
    const dreamedAt = parsed.dreamedAt ?? current.dreamed_at;

    let fulfilledAt = current.fulfilled_at;
    let meaning = current.fulfillment_meaning;
    if (parsed.fulfilledAt !== undefined) {
        fulfilledAt = parsed.fulfilledAt;
        // Reabrirlo se lleva por delante lo que significó (D10).
        if (fulfilledAt === null) meaning = null;
    }
    if (parsed.fulfillmentMeaning !== undefined && fulfilledAt !== null) {
        meaning = blankToNull(parsed.fulfillmentMeaning);
    }
    ensureOrder(dreamedAt, fulfilledAt);

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            `UPDATE dreams SET title = ?, body = ?, search_text = ?, dreamed_at = ?, interpretation = ?,
         fulfilled_at = ?, fulfillment_meaning = ?, updated_at = ? WHERE id = ? AND owner_id = ?`,
            title,
            body,
            searchText(title, body, interpretation),
            dreamedAt,
            interpretation,
            fulfilledAt,
            meaning,
            nowIso(),
            id,
            ownerId,
        );
        await setEmotions(db, ownerId, id, parsed.emotionIds);
    });
}

export async function deleteDream(ownerId: string, id: string): Promise<void> {
    const db = await getDb();
    const owned = await db.getFirstAsync<{ id: string }>(
        'SELECT id FROM dreams WHERE id = ? AND owner_id = ? AND deleted_at IS NULL',
        id,
        ownerId,
    );
    if (!owned) return;

    // «Se borra el sueño, su interpretación y sus audios»: los ficheros también.
    await removeAudiosOf([id]);
    await db.runAsync(
        'UPDATE dreams SET deleted_at = ?, updated_at = ? WHERE id = ? AND owner_id = ?',
        nowIso(),
        nowIso(),
        id,
        ownerId,
    );
}
