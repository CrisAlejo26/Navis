import { ALL_LOCAL_TABLES, entityKeyColumns, splitEntityId, type LocalRow } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';

/**
 * Alias de fusión: «este creyente es ahora aquel». Duran para siempre, porque el
 * servidor o un teléfono atrasado pueden seguir hablando del id retirado meses
 * después. Una fila que llega con ese id se redirige al conservado; el creyente
 * retirado no se resucita.
 */
export const ALIASED_TABLE = 'believers';

/** Las tablas que apuntan a un creyente con `believer_id`. */
export const BELIEVER_REFERENCES: readonly string[] = ALL_LOCAL_TABLES.filter(
    (table) => table.name !== ALIASED_TABLE && table.columns.some((c) => c.name === 'believer_id'),
).map((table) => table.name);

/** Si `believer_id` forma parte de la clave de la tabla (pertenencias de una lista). */
export const referenceInKey = (table: string): boolean =>
    entityKeyColumns(table).includes('believer_id');

export async function canonicalBeliever(db: LocalDb, id: string): Promise<string | null> {
    const row = await db.getFirstAsync<{ canonical_id: string }>(
        'SELECT canonical_id FROM sync_aliases WHERE table_name = ? AND alias_id = ?',
        ALIASED_TABLE,
        id,
    );
    return row?.canonical_id ?? null;
}

export async function recordAlias(
    db: LocalDb,
    aliasId: string,
    canonicalId: string,
    now: string,
): Promise<void> {
    await db.runAsync(
        'INSERT OR REPLACE INTO sync_aliases (table_name, alias_id, canonical_id, created_at) VALUES (?, ?, ?, ?)',
        ALIASED_TABLE,
        aliasId,
        canonicalId,
        now,
    );
}

export type AliasVerdict =
    /** Nada que ver con ningún alias. */
    | { kind: 'clean' }
    /** El cambio habla de un creyente retirado (o de una pertenencia suya): se ignora. */
    | { kind: 'ignore' }
    /** La fila apunta a un creyente retirado: se redirige al conservado. */
    | { kind: 'redirect'; row: LocalRow };

/** Qué hacer con un cambio que llega del servidor a la vista de los alias. */
export async function applyAliases(
    db: LocalDb,
    table: string,
    entityId: string,
    row: LocalRow | null,
): Promise<AliasVerdict> {
    if (table === ALIASED_TABLE) {
        return (await canonicalBeliever(db, entityId)) ? { kind: 'ignore' } : { kind: 'clean' };
    }
    if (!BELIEVER_REFERENCES.includes(table)) return { kind: 'clean' };

    if (referenceInKey(table)) {
        const key = splitEntityId(table, entityId);
        const aliased = await canonicalBeliever(db, key.believer_id ?? '');
        return aliased ? { kind: 'ignore' } : { kind: 'clean' };
    }
    const believerId = row?.believer_id;
    if (typeof believerId !== 'string') return { kind: 'clean' };
    const canonical = await canonicalBeliever(db, believerId);
    return canonical && row
        ? { kind: 'redirect', row: { ...row, believer_id: canonical } }
        : { kind: 'clean' };
}
