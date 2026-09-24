import {
    createFulfillmentSchema,
    updateFulfillmentSchema,
    type CreateFulfillmentInput,
    type UpdateFulfillmentInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';

/**
 * Los cumplimientos parciales de una profecía **en local** (RFC 0004 D4).
 *
 * Es el **único** sitio que escribe `prophecies.last_fulfillment_at`: se
 * recalcula aquí al crear, editar y borrar, y no se toca desde ningún otro
 * repositorio — la misma disciplina que `last_note_at` en `notes-repo.ts`.
 */

/** Un cumplimiento no puede ser anterior a la fecha en que se recibió (D7). */
function ensureAfterReception(receivedAt: string, occurredAt: string): void {
    if (occurredAt < receivedAt) {
        throw new Error('Eso es anterior a la fecha en que la recibiste');
    }
}

async function receivedAtOf(ownerId: string, prophecyId: string): Promise<string> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ received_at: string }>(
        'SELECT received_at FROM prophecies WHERE id = ? AND owner_id = ? AND deleted_at IS NULL',
        prophecyId,
        ownerId,
    );
    if (!row) throw new Error('Esa profecía no existe');
    return row.received_at;
}

/** El único sitio donde se escribe `last_fulfillment_at` (D4). */
async function refreshLast(ownerId: string, prophecyId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `UPDATE prophecies SET last_fulfillment_at = (
       SELECT MAX(occurred_at) FROM prophecy_fulfillments
       WHERE prophecy_id = ? AND owner_id = ? AND deleted_at IS NULL
     ), updated_at = ? WHERE id = ? AND owner_id = ?`,
        prophecyId,
        ownerId,
        nowIso(),
        prophecyId,
        ownerId,
    );
}

export async function addFulfillment(
    ownerId: string,
    prophecyId: string,
    input: CreateFulfillmentInput,
): Promise<string> {
    const parsed = createFulfillmentSchema.parse(input);
    ensureAfterReception(await receivedAtOf(ownerId, prophecyId), parsed.occurredAt);

    const db = await getDb();
    const id = newId();
    const now = nowIso();
    await db.runAsync(
        `INSERT INTO prophecy_fulfillments (id, created_at, updated_at, deleted_at, prophecy_id, owner_id, text, occurred_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?, ?)`,
        id,
        now,
        now,
        prophecyId,
        ownerId,
        parsed.text,
        parsed.occurredAt,
    );
    await refreshLast(ownerId, prophecyId);
    return id;
}

export async function updateFulfillment(
    ownerId: string,
    prophecyId: string,
    id: string,
    input: UpdateFulfillmentInput,
): Promise<void> {
    const parsed = updateFulfillmentSchema.parse(input);
    if (parsed.occurredAt !== undefined) {
        ensureAfterReception(await receivedAtOf(ownerId, prophecyId), parsed.occurredAt);
    }

    const db = await getDb();
    const fields: string[] = [];
    const params: (string | null)[] = [];
    if (parsed.text !== undefined) {
        fields.push('text = ?');
        params.push(parsed.text);
    }
    if (parsed.occurredAt !== undefined) {
        fields.push('occurred_at = ?');
        params.push(parsed.occurredAt);
    }
    if (fields.length > 0) {
        await db.runAsync(
            `UPDATE prophecy_fulfillments SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND prophecy_id = ? AND owner_id = ?`,
            ...params,
            nowIso(),
            id,
            prophecyId,
            ownerId,
        );
    }
    await refreshLast(ownerId, prophecyId);
}

export async function deleteFulfillment(
    ownerId: string,
    prophecyId: string,
    id: string,
): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'UPDATE prophecy_fulfillments SET deleted_at = ?, updated_at = ? WHERE id = ? AND prophecy_id = ? AND owner_id = ?',
        nowIso(),
        nowIso(),
        id,
        prophecyId,
        ownerId,
    );
    await refreshLast(ownerId, prophecyId);
}
