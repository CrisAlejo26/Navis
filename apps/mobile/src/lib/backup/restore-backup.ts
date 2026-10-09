import { repairChurchAccess } from '@/data/church-access-repair';
import { getDb, SCHEMA_VERSION } from '@/data/db';
import { listCoverFileId } from '@/data/list-cover-storage';
import { unwrapBackupKeys } from '../tables/backup-keys';
import { validateTableBackup } from '../tables/restore-validation';
import { verifyIntegrity } from './backup-integrity';
import { upgradeLegacyTables } from './legacy-tables';
import { openPackage, PackagePasswordError, parseEncryptedPackage } from './package-crypto';
import { restoreRows } from './restore-rows';
import { restoreTransaction } from './restore-transaction';

import {
    BACKUP_TABLES,
    backupColumns,
    backupSchema,
    type Backup,
    type BackupOrigin,
    type BackupFiles,
    type BackupRow,
} from './backup-format';

export type RestoreErrorCode = 'invalid' | 'newer' | 'password' | 'corrupt';

/** Por qué no se restauró; la pantalla lo traduce. Nada se ha tocado cuando sale esto. */
export class RestoreError extends Error {
    constructor(readonly code: RestoreErrorCode) {
        super(code);
    }
}

/** El texto de la copia en claro: si está cifrada, se abre con la contraseña (cifrado autenticado). */
async function plainText(text: string, secret?: string): Promise<string> {
    const encrypted = parseEncryptedPackage(text);
    if (!encrypted) return text;
    if (!secret) throw new RestoreError('password');
    try {
        return await openPackage(encrypted, secret);
    } catch (error) {
        if (error instanceof PackagePasswordError) throw new RestoreError('password');
        throw error;
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
    // Truncada, editada o sin alguno de sus ficheros: se sabe antes de tocar nada.
    if (!verifyIntegrity(parsed.data).ok) throw new RestoreError('corrupt');
    return parsed.data;
}

/** Lo que se sabe de una copia sin restaurarla ni tocar nada. */
export interface BackupInspection {
    backup: Backup;
    createdAt: string;
    origin?: BackupOrigin;
    /** Ficheros que la copia ya traía anotados como ausentes al hacerse. */
    missingFiles: number;
}

/**
 * Comprueba que una copia se puede restaurar: la abre, valida su forma, su
 * versión y su integridad. No escribe nada. Es lo que verifica una copia previa
 * a una operación antes de fiarse de ella.
 */
export async function inspectBackup(text: string, secret?: string): Promise<BackupInspection> {
    const backup = parse(await plainText(text, secret));
    upgradeLegacyTables(backup);
    validateShape(backup);
    const missing = backup.manifest?.missing;
    return {
        backup,
        createdAt: backup.createdAt,
        origin: backup.origin,
        missingFiles: (missing?.audios.length ?? 0) + (missing?.photos.length ?? 0),
    };
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
    if (table === 'lists' && row.cover_key != null)
        return { ...row, cover_key: files.photoUri(listCoverFileId(id)) };
    if (table === 'note_audios' || table === 'dream_audios' || table === 'journal_entry_audios') {
        return { ...row, storage_key: files.audioUri(id) };
    }
    if (table === 'believers' && row.photo_key !== null) {
        return { ...row, photo_key: files.photoUri(id) };
    }
    return row;
}

/** Qué se restauró y qué advertir: una copia con ficheros ausentes restaura, pero lo dice. */
export interface RestoreReport {
    createdAt: string;
    origin?: BackupOrigin;
    missingFiles: number;
}

/**
 * Reemplaza **todo** lo que hay por el contenido de la copia, dentro de una
 * transacción: o entra entera o no cambia nada. Los ficheros se escriben antes,
 * con su identificador como nombre, y un fallo de la base no los hace daño.
 */
export async function restoreBackup(
    text: string,
    files: BackupFiles,
    secret?: string,
): Promise<RestoreReport> {
    const { backup, createdAt, origin, missingFiles } = await inspectBackup(text, secret);
    const accountPepper = await unwrapBackupKeys(backup.tableKeys, secret);
    await validateTableBackup(backup);

    for (const [id, content] of Object.entries(backup.audios)) await files.writeAudio(id, content);
    for (const [id, content] of Object.entries(backup.photos)) await files.writePhoto(id, content);

    const db = await getDb();
    await restoreTransaction(db, accountPepper, async (db) => {
        for (const table of [...BACKUP_TABLES].reverse()) {
            await db.runAsync(`DELETE FROM "${table.name}"`);
        }
        for (const table of BACKUP_TABLES) {
            await restoreRows(
                db,
                table.name,
                (backup.tables[table.name] ?? []).map((row) => localize(table.name, row, files)),
            );
        }
        await repairChurchAccess(db);
    });
    return { createdAt, origin, missingFiles };
}
