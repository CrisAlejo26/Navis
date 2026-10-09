import { mergePolicyFor, mergeThreeWay, type LocalRow, type MergeResult } from '@navis/shared';

import type { LocalDb } from '@/data/local-db';

import { fingerprintRow, restoreRow, unsealRow } from './secret-cells';

/**
 * Fusiona la fila local con la remota sobre la versión base. Las contraseñas se
 * comparan por huella (la base solo guarda huellas), así que una edición de una
 * contraseña en un lado y de otra celda en el otro **no** choca; y el resultado
 * vuelve a llevar las contraseñas reales, listas para sellar y guardar.
 *
 * `local` y `remote` llegan en la forma de SQLite (con las contraseñas selladas).
 */
export async function mergeRows(
    db: LocalDb,
    table: string,
    base: LocalRow | null,
    local: LocalRow,
    remote: LocalRow,
): Promise<MergeResult> {
    const localPrint = await fingerprintRow(db, table, await unsealRow(table, local));
    const remotePrint = await fingerprintRow(db, table, await unsealRow(table, remote));
    const result = mergeThreeWay(base, localPrint.row, remotePrint.row, mergePolicyFor(table));
    const originals = new Map([...remotePrint.originals, ...localPrint.originals]);
    return { ...result, merged: restoreRow(result.merged, originals) };
}
