import { repairChurchAccess } from '@/data/church-access-repair';
import { getDb, SCHEMA_VERSION } from '@/data/db';

import {
    BACKUP_TABLES,
    backupColumns,
    backupSchema,
    type Backup,
    type BackupFiles,
    type BackupRow,
} from './backup-format';

export type RestoreErrorCode = 'invalid' | 'newer';

/** Por qué no se restauró; la pantalla lo traduce. Nada se ha tocado cuando sale esto. */
export class RestoreError extends Error {
    constructor(readonly code: RestoreErrorCode) {
        super(code);
    }
}

function parse(text: string): Backup {
    let raw: unknown;
    try {
        raw = JSON.parse(text);
    } catch {
        throw new RestoreError('invalid');
    }
    const parsed = backupSchema.safeParse(raw);
    if (!parsed.success) throw new RestoreError('invalid');
    if (parsed.data.schemaVersion > SCHEMA_VERSION) throw new RestoreError('newer');
    return parsed.data;
}

/**
 * Comprueba que la copia solo habla de tablas y columnas que esta app conoce:
 * los nombres acaban dentro de un `INSERT`, así que un fichero ajeno no se fía.
 */
function validateShape(backup: Backup): void {
    const known = new Map(BACKUP_TABLES.map((t) => [t.name, new Set(backupColumns(t))]));
    for (const [name, rows] of Object.entries(backup.tables)) {
        const columns = known.get(name);
        if (!columns) throw new RestoreError('invalid');
        for (const row of rows) {
            if (Object.keys(row).some((column) => !columns.has(column))) {
                throw new RestoreError('invalid');
            }
        }
    }
}

/** Las URI de los ficheros son de este teléfono: se recalculan, no se copian de la copia. */
function localize(table: string, row: BackupRow, files: BackupFiles): BackupRow {
    const id = String(row.id);
    if (table === 'note_audios' || table === 'dream_audios') {
        return { ...row, storage_key: files.audioUri(id) };
    }
    if (table === 'believers' && row.photo_key !== null) {
        return { ...row, photo_key: files.photoUri(id) };
    }
    return row;
}

/**
 * Reemplaza **todo** lo que hay por el contenido de la copia, dentro de una
 * transacción: o entra entera o no cambia nada. Los ficheros se escriben antes,
 * con su identificador como nombre, y un fallo de la base no los hace daño.
 */
export async function restoreBackup(text: string, files: BackupFiles): Promise<void> {
    const backup = parse(text);
    validateShape(backup);

    for (const [id, content] of Object.entries(backup.audios)) await files.writeAudio(id, content);
    for (const [id, content] of Object.entries(backup.photos)) await files.writePhoto(id, content);

    const db = await getDb();
    await db.withTransactionAsync(async () => {
        for (const table of [...BACKUP_TABLES].reverse()) {
            await db.runAsync(`DELETE FROM "${table.name}"`);
        }
        for (const table of BACKUP_TABLES) {
            for (const row of backup.tables[table.name] ?? []) {
                const local = localize(table.name, row, files);
                const columns = Object.keys(local);
                const values = Object.values(local);
                await db.runAsync(
                    `INSERT INTO "${table.name}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
                    ...values,
                );
            }
        }
        await repairChurchAccess(db);
    });
}
