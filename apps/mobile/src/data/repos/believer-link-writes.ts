import { newId, nowIso } from '../db';
import type { LocalDb } from '../local-db';
import { assertInChurch, assertAllInChurch } from '../church-scope';
export async function replaceLinks(
    db: LocalDb,
    believerId: string,
    table: 'believer_ministries' | 'believer_gifts' | 'believer_tag_links',
    column: 'ministry' | 'gift_id' | 'tag_id',
    values: string[],
    dateColumn: 'started_at' | 'received_at' | null = null,
    dates: Record<string, string | null> = {},
    featuredTagId: string | null = null,
    churchId: string,
): Promise<void> {
    await assertInChurch(db, 'believers', believerId, churchId);
    if (column === 'gift_id') await assertAllInChurch(db, 'gifts', values, churchId);
    if (column === 'tag_id') await assertAllInChurch(db, 'believer_tags', values, churchId);
    // La API borra y reescribe el juego entero (BelieverLinksService): son
    // cuatro filas y el índice único ya impide repetir. Aquí, lo mismo.
    await db.runAsync(
        `DELETE FROM ${table} WHERE believer_id = ? AND believer_id IN (SELECT id FROM believers WHERE church_id = ?)`,
        believerId,
        churchId,
    );
    for (const value of values) {
        const date = dates[value] ?? null;
        if (dateColumn && date) {
            await db.runAsync(
                `INSERT INTO ${table} (id, created_at, updated_at, deleted_at, believer_id, ${column}, ${dateColumn}) SELECT ?, ?, ?, NULL, ?, ?, ? WHERE EXISTS (SELECT id FROM believers WHERE id = ? AND church_id = ?)`,
                newId(),
                nowIso(),
                nowIso(),
                believerId,
                value,
                date,
                believerId,
                churchId,
            );
        } else {
            await db.runAsync(
                `INSERT INTO ${table} (id, created_at, updated_at, deleted_at, believer_id, ${column}) SELECT ?, ?, ?, NULL, ?, ? WHERE EXISTS (SELECT id FROM believers WHERE id = ? AND church_id = ?)`,
                newId(),
                nowIso(),
                nowIso(),
                believerId,
                value,
                believerId,
                churchId,
            );
        }
    }
    if (table === 'believer_tag_links') {
        await db.runAsync(
            'UPDATE believers SET featured_tag_id = ?, updated_at = ? WHERE id = ? AND believers.church_id = ? ',
            featuredTagId,
            nowIso(),
            believerId,
            churchId,
        );
    }
}
