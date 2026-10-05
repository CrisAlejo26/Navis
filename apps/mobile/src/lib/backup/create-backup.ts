import { getDb, SCHEMA_VERSION } from '@/data/db';
import { listCoverFileId } from '@/data/list-cover-storage';
import { wrapBackupKeys } from '../tables/backup-keys';

import {
    BACKUP_FORMAT,
    BACKUP_TABLES,
    BACKUP_VERSION,
    backupColumns,
    type Backup,
    type BackupFiles,
    type BackupRow,
} from './backup-format';

async function readFiles(
    ids: string[],
    read: (id: string) => Promise<string | null>,
): Promise<Record<string, string>> {
    const found: Record<string, string> = {};
    for (const id of ids) {
        const content = await read(id);
        if (content) found[id] = content;
    }
    return found;
}

/** Vuelca la base local y sus ficheros en un solo objeto, listo para guardarse como JSON. */
export async function buildBackup(files: BackupFiles, secret?: string): Promise<Backup> {
    const db = await getDb();
    const tables: Backup['tables'] = {};
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

    return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        schemaVersion: SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        tables,
        audios: await readFiles(audioIds, (id) => files.readAudio(id)),
        photos: await readFiles(photoIds, (id) => files.readPhoto(id)),
        tableKeys: await wrapBackupKeys(tables.custom_table_rows ?? [], secret),
    };
}
