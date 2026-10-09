import { entityKeyColumns } from './sync-keys';
import { syncedTables } from './sync-trigger-sql';

/**
 * Los triggers del SQLite del teléfono (Fase 5 del plan de sincronización). Cada
 * escritura local —venga de la pantalla que venga— deja una entrada en
 * `sync_outbox` **dentro de la misma transacción** que la modificó: o quedan las
 * dos o ninguna, y un cierre de la app a mitad no pierde nada.
 *
 * La cola guarda *qué* cambió, no el contenido: al enviar se lee la fila tal y
 * como está entonces. Por eso varias ediciones seguidas de la misma entidad se
 * funden en una sola entrada pendiente (`ON CONFLICT` sobre el índice parcial).
 *
 * Solo escriben cuando hay un destino vinculado (`capturing = 1`) y no se está
 * aplicando una descarga (`applying = 0`): lo que llega del servidor no vuelve a
 * subir. `sync_state` es una fila única (`id = 1`).
 */
const GUARD = `WHEN (SELECT capturing FROM sync_state WHERE id = 1) = 1
  AND (SELECT applying FROM sync_state WHERE id = 1) = 0`;

function entityId(table: string, ref: 'NEW' | 'OLD'): string {
    return entityKeyColumns(table)
        .map((column) => `${ref}.${column}`)
        .join(` || ':' || `);
}

function body(table: string, ref: 'NEW' | 'OLD', op: string): string {
    return `${GUARD} BEGIN
INSERT INTO sync_outbox (destination, table_name, entity_id, op, state, queued_at)
VALUES ((SELECT destination FROM sync_state WHERE id = 1), '${table}', ${entityId(table, ref)}, ${op}, 'pending',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
ON CONFLICT (destination, table_name, entity_id) WHERE state = 'pending'
DO UPDATE SET op = excluded.op, queued_at = excluded.queued_at;
END`;
}

/** Una sentencia por elemento; idempotentes (`DROP … IF EXISTS` + `CREATE`). */
export function localTriggerStatements(tables: readonly string[] = syncedTables()): string[] {
    return tables.flatMap((table) => [
        `DROP TRIGGER IF EXISTS outbox_${table}_ai`,
        `CREATE TRIGGER outbox_${table}_ai AFTER INSERT ON "${table}" ${body(table, 'NEW', `'upsert'`)}`,
        `DROP TRIGGER IF EXISTS outbox_${table}_au`,
        `CREATE TRIGGER outbox_${table}_au AFTER UPDATE ON "${table}" ${body(table, 'NEW', `'upsert'`)}`,
        `DROP TRIGGER IF EXISTS outbox_${table}_ad`,
        `CREATE TRIGGER outbox_${table}_ad AFTER DELETE ON "${table}" ${body(table, 'OLD', `'delete'`)}`,
    ]);
}
