import { entityKeyColumns, joinEntityId, type LocalRow } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';
import { inLocalTransaction } from '@/data/local-transaction';

import { BELIEVER_REFERENCES, recordAlias, referenceInKey } from './aliases';
import { deleteLocalRow, readLocalRow, writeLocalRow } from './local-row';
import { keyWhere, localTable } from './wire-row';

/** Datos de contacto que se traen del retirado si el conservado no los tiene. */
const FILLABLE = [
    'phone',
    'email',
    'arrived_at',
    'arrival_site',
    'bible_readings',
    'vivencias_readings',
    'bible_institute_times',
];

/**
 * Vínculos que la API protege con un índice único por creyente y esta columna: el
 * esquema local no lo tiene, así que sin esto una fusión dejaría dos veces la
 * misma etiqueta, el mismo don o la misma labor.
 */
const NATURAL_KEYS: Readonly<Record<string, string>> = {
    believer_tag_links: 'tag_id',
    believer_gifts: 'gift_id',
    believer_ministries: 'ministry',
};

export interface MergeReport {
    moved: number;
    collapsed: number;
}

const entityOf = (table: string, row: LocalRow): string =>
    joinEntityId(
        table,
        Object.fromEntries(entityKeyColumns(table).map((column) => [column, String(row[column])])),
    );

/** Reapunta una fila al creyente conservado; si choca con otra igual (misma etiqueta, misma lista…), sobra y se retira. */
async function repoint(
    db: LocalDb,
    table: string,
    row: LocalRow,
    keepId: string,
    now: string,
): Promise<'moved' | 'collapsed'> {
    const oldId = entityOf(table, row);
    if (referenceInKey(table)) {
        // La clave cambia: se crea la fila nueva y se borra la vieja (el servidor ve las dos cosas).
        const target = { ...row, believer_id: keepId };
        const exists = await readLocalRow(db, table, entityOf(table, target));
        await deleteLocalRow(db, table, oldId, now);
        if (exists) return 'collapsed';
        await writeLocalRow(db, table, entityOf(table, target), target);
        return 'moved';
    }
    const natural = NATURAL_KEYS[table];
    if (natural !== undefined) {
        const twin = await db.getFirstAsync<{ total: number }>(
            `SELECT COUNT(*) AS total FROM "${table}" WHERE believer_id = ? AND "${natural}" = ? AND deleted_at IS NULL`,
            keepId,
            row[natural],
        );
        if ((twin?.total ?? 0) > 0) {
            await deleteLocalRow(db, table, oldId, now);
            return 'collapsed';
        }
    }
    const where = keyWhere(table, oldId);
    try {
        await db.runAsync(
            `UPDATE "${table}" SET believer_id = ? WHERE ${where.sql}`,
            keepId,
            ...where.params,
        );
        return 'moved';
    } catch {
        // Una restricción única (un vínculo igual ya existe): esta sobra.
        await deleteLocalRow(db, table, oldId, now);
        return 'collapsed';
    }
}

/**
 * Fusiona dos fichas de creyente (Fase 6): todo lo que colgaba de `dropId`
 * —notas, etiquetas, dones, audios, pertenencias de listas, celdas de tablas—
 * pasa a `keepId`; los datos de contacto que le faltaban se traen; `dropId` se
 * borra y queda un alias persistente. Son escrituras normales: entran en la cola
 * y viajan al servidor como cualquier edición.
 *
 * La persona confirma antes (`findDuplicateCandidates` solo sugiere) y los dos ids
 * deben ser de la misma iglesia.
 */
export async function mergeBelievers(
    db: LocalDb,
    keepId: string,
    dropId: string,
    now: string,
): Promise<MergeReport | 'invalid'> {
    if (keepId === dropId) return 'invalid';
    const report: MergeReport = { moved: 0, collapsed: 0 };
    let valid = true;

    await inLocalTransaction(db, async (tx) => {
        const keep = await readLocalRow(tx, 'believers', keepId);
        const drop = await readLocalRow(tx, 'believers', dropId);
        if (!keep || !drop || keep.church_id !== drop.church_id) {
            valid = false;
            return;
        }

        for (const table of BELIEVER_REFERENCES) {
            const hasDeletedAt = localTable(table).columns.some((c) => c.name === 'deleted_at');
            const rows = await tx.getAllAsync<LocalRow>(
                `SELECT * FROM "${table}" WHERE believer_id = ?${hasDeletedAt ? ' AND deleted_at IS NULL' : ''}`,
                dropId,
            );
            for (const row of rows) {
                if ((await repoint(tx, table, row, keepId, now)) === 'moved') report.moved += 1;
                else report.collapsed += 1;
            }
        }

        const fill: LocalRow = {};
        for (const column of FILLABLE) {
            const empty = keep[column] === null || keep[column] === '';
            if (empty && drop[column] !== null && drop[column] !== '') fill[column] = drop[column];
        }
        if (Object.keys(fill).length > 0) {
            await writeLocalRow(tx, 'believers', keepId, { ...keep, ...fill, updated_at: now });
        }
        await deleteLocalRow(tx, 'believers', dropId, now);
        await recordAlias(tx, dropId, keepId, now);
    });

    return valid ? report : 'invalid';
}
