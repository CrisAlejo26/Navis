import { getDb, SCHEMA_VERSION } from '@/data/db';
import { listCoverFileId } from '@/data/list-cover-storage';
import { wrapBackupKeys } from '../tables/backup-keys';

import { buildManifest, contentHash, type MissingFiles } from './backup-integrity';
import {
    BACKUP_FORMAT,
    BACKUP_TABLES,
    BACKUP_VERSION,
    backupColumns,
    type Backup,
    type BackupFiles,
    type BackupOrigin,
    type BackupRow,
} from './backup-format';

interface ReadFiles {
    found: Record<string, string>;
    missing: string[];
}

async function readFiles(
    ids: string[],
    read: (id: string) => Promise<string | null>,
): Promise<ReadFiles> {
    const found: Record<string, string> = {};
    const missing: string[] = [];
    for (const id of ids) {
        const content = await read(id);
        if (content) found[id] = content;
        else missing.push(id);
    }
    return { found, missing };
}

export interface BuildBackupOptions {
    origin?: BackupOrigin;
    /**
     * Envolver las claves de las celdas protegidas y el pepper de la cuenta para
     * poder restaurar en **otro** teléfono (pide contraseña). Las copias de
     * seguridad previas a una operación se restauran en este mismo teléfono, donde
     * esas claves ya están, y no las llevan.
     */
    portableKeys?: boolean;
}

const UNKNOWN_ORIGIN: BackupOrigin = { appVersion: 'desconocida', platform: 'desconocida' };

/** Todas las filas, leídas dentro de **una** transacción: una copia coherente, no tablas de momentos distintos. */
async function snapshotTables(): Promise<Backup['tables']> {
    const db = await getDb();
    const tables: Backup['tables'] = {};
    await db.withTransactionAsync(async () => {
        for (const table of BACKUP_TABLES) {
            // Las columnas conocidas, no `SELECT *`: una base que viene de migraciones
            // antiguas puede arrastrar columnas muertas y la restauración las rechazaría.
            const columns = backupColumns(table)
                .map((name) => `"${name}"`)
                .join(', ');
            tables[table.name] = await db.getAllAsync<BackupRow>(
                `SELECT ${columns} FROM "${table.name}"`,
            );
        }
    });
    return tables;
}

/**
 * Vuelca la base local y sus ficheros en un solo objeto, listo para guardarse
 * como JSON. Lo que no se pudo leer (un audio cuyo fichero ya no está) queda
 * anotado en el manifiesto como ausente: la copia no finge estar completa.
 * Nunca incluye sesiones ni credenciales de una instalación remota: no están en
 * ninguna tabla local (viven en SecureStore y en el almacén de conexión).
 */
export async function buildBackup(
    files: BackupFiles,
    secret?: string,
    options: BuildBackupOptions = {},
): Promise<Backup> {
    const tables = await snapshotTables();

    const audioIds = [
        ...(tables.note_audios ?? []),
        ...(tables.dream_audios ?? []),
        ...(tables.journal_entry_audios ?? []),
    ].map((row) => String(row.id));
    const photoIds = (tables.believers ?? [])
        .filter((row) => row.photo_key !== null)
        .map((row) => String(row.id));
    photoIds.push(
        ...(tables.lists ?? [])
            .filter((row) => row.cover_key != null)
            .map((row) => listCoverFileId(String(row.id))),
    );

    const audios = await readFiles(audioIds, (id) => files.readAudio(id));
    const photos = await readFiles(photoIds, (id) => files.readPhoto(id));
    const missing: MissingFiles = { audios: audios.missing, photos: photos.missing };

    const content = {
        tables,
        audios: audios.found,
        photos: photos.found,
        tableKeys:
            options.portableKeys === false
                ? undefined
                : await wrapBackupKeys(tables.custom_table_rows ?? [], secret),
    };

    return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        schemaVersion: SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        origin: options.origin ?? UNKNOWN_ORIGIN,
        manifest: buildManifest(content, missing),
        integrity: contentHash(content),
        ...content,
    };
}
