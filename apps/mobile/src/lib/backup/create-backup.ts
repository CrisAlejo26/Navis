import { getDb, SCHEMA_VERSION } from '@/data/db';

import {
    BACKUP_FORMAT,
    BACKUP_TABLES,
    BACKUP_VERSION,
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
export async function buildBackup(files: BackupFiles): Promise<Backup> {
    const db = await getDb();
    const tables: Backup['tables'] = {};
    for (const table of BACKUP_TABLES) {
        // Solo las columnas del esquema, no `SELECT *`: una base que viene de
        // migraciones antiguas arrastra columnas que ya no existen en él
        // (`believers.featured_tag_id`) y la restauración las rechazaría.
        const columns = table.columns.map((column) => `"${column.name}"`).join(', ');
        tables[table.name] = await db.getAllAsync<BackupRow>(
            `SELECT ${columns} FROM "${table.name}"`,
        );
    }

    const audioIds = [...(tables.note_audios ?? []), ...(tables.dream_audios ?? [])].map((row) =>
        String(row.id),
    );
    const photoIds = (tables.believers ?? [])
        .filter((row) => row.photo_key !== null)
        .map((row) => String(row.id));

    return {
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION,
        schemaVersion: SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        tables,
        audios: await readFiles(audioIds, (id) => files.readAudio(id)),
        photos: await readFiles(photoIds, (id) => files.readPhoto(id)),
    };
}
