import type { LocalDb } from '../local-db';

/** Cuántos `?` se bindean de una vez: SQLite tiene un tope de variables por consulta. */
const CHUNK = 500;

/**
 * Quién ocupa cada fase, en el orden en que se eligieron: la pareja local de
 * `slotBelieverIds` de la API. Una fase sin filas no aparece en el mapa, y eso
 * quiere decir sin asignar.
 *
 * Los identificadores vacíos no llegan a la consulta (la trampa del `IN ('')`).
 */
export async function peopleBySlot(
    db: LocalDb,
    slotIds: readonly string[],
): Promise<Map<string, string[]>> {
    const ids = [...new Set(slotIds)].filter(Boolean);
    const bySlot = new Map<string, string[]>();

    for (let start = 0; start < ids.length; start += CHUNK) {
        const chunk = ids.slice(start, start + CHUNK);
        const rows = await db.getAllAsync<{ slot_id: string; believer_id: string }>(
            `SELECT slot_id, believer_id FROM meeting_slot_believers
       WHERE slot_id IN (${chunk.map(() => '?').join(', ')}) AND deleted_at IS NULL
       ORDER BY slot_id ASC, position ASC`,
            ...chunk,
        );
        for (const row of rows) {
            bySlot.set(row.slot_id, [...(bySlot.get(row.slot_id) ?? []), row.believer_id]);
        }
    }

    return bySlot;
}

/** Reemplaza las personas de una fase por `believerIds`, en ese orden. */
export async function replaceSlotPeople(
    db: LocalDb,
    slotId: string,
    believerIds: readonly string[],
    now: string,
    newId: () => string,
): Promise<void> {
    await db.runAsync('DELETE FROM meeting_slot_believers WHERE slot_id = ?', slotId);
    for (const [position, believerId] of believerIds.entries()) {
        await db.runAsync(
            'INSERT INTO meeting_slot_believers (id, created_at, updated_at, deleted_at, slot_id, believer_id, position) VALUES (?, ?, ?, NULL, ?, ?, ?)',
            newId(),
            now,
            now,
            slotId,
            believerId,
            position,
        );
    }
}
