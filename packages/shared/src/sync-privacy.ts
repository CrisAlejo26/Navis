import { ALL_LOCAL_TABLES } from './local-schema';
import type { LocalRow } from './sync-codec';
import { SYNC_COVERAGE } from './sync-coverage';

/**
 * Quién puede ver **cada registro**, no solo cada tabla: dentro de una misma
 * iglesia, una nota de creyente es de la congregación y una tarea es de quien la
 * creó. Es la misma regla que aplican los triggers del registro de cambios
 * (`sync-trigger-sql.ts`) y por eso `sync-privacy.test.ts` las compara.
 *
 * - `system`: catálogos; los ve cualquiera.
 * - `church`: los miembros de la iglesia del registro.
 * - `private`: solo su dueño (profecías, sueños, enseñanzas, tareas con dueño…).
 * - `inherits`: una fila hija; hereda lo de su padre.
 */
export type SyncVisibility =
    | { kind: 'system' }
    | { kind: 'church'; churchId: string }
    | { kind: 'private'; ownerId: string; churchId: string | null }
    | { kind: 'inherits' };

const hasOwnerColumn = (table: string): boolean =>
    ALL_LOCAL_TABLES.find((one) => one.name === table)?.columns.some(
        (column) => column.name === 'owner_id',
    ) ?? false;

const text = (value: string | number | null | undefined): string | null =>
    typeof value === 'string' && value !== '' ? value : null;

export function recordVisibility(table: string, row: LocalRow): SyncVisibility {
    const entry = SYNC_COVERAGE[table];
    if (!entry || entry.policy !== 'synced') throw new Error(`Tabla no sincronizada: ${table}`);

    // Una iglesia es de sus miembros, aunque tenga `owner_id`.
    if (table === 'churches') return { kind: 'church', churchId: String(row.id) };

    if (entry.scope === 'system') return { kind: 'system' };
    if (entry.scope === 'parent') return { kind: 'inherits' };

    const ownerId = hasOwnerColumn(table) ? text(row.owner_id) : null;
    if (entry.scope === 'owner') {
        if (!ownerId) throw new Error(`${table}: un dato personal sin dueño`);
        return { kind: 'private', ownerId, churchId: null };
    }

    const churchId = text(row.church_id);
    if (!churchId) throw new Error(`${table}: una fila de iglesia sin iglesia`);
    return ownerId ? { kind: 'private', ownerId, churchId } : { kind: 'church', churchId };
}
