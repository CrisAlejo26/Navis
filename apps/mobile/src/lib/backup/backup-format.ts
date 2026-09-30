import { ALL_LOCAL_TABLES, type LocalTable } from '@navis/shared';
import { z } from 'zod';

export const BACKUP_FORMAT = 'navis-backup';
export const BACKUP_VERSION = 1;

const cell = z.union([z.string(), z.number(), z.null()]);

/**
 * Una copia de seguridad: todas las filas de la base local más los audios y las
 * fotos **dentro** del mismo fichero (en base64, por su identificador). Los
 * ficheros no viven en la base (CLAUDE.md), así que una copia que solo llevara
 * las filas perdería los audios sin avisar.
 */
export const backupSchema = z.object({
    format: z.literal(BACKUP_FORMAT),
    version: z.literal(BACKUP_VERSION),
    /** Versión del esquema local con que se hizo; una app más vieja no la restaura. */
    schemaVersion: z.number().int().positive(),
    createdAt: z.string(),
    tables: z.record(z.string(), z.array(z.record(z.string(), cell))),
    audios: z.record(z.string(), z.string()),
    photos: z.record(z.string(), z.string()),
});

export type Backup = z.infer<typeof backupSchema>;
export type BackupRow = Backup['tables'][string][number];

/** Lo que el sistema de ficheros del teléfono sabe hacer con los audios y las fotos. */
export interface BackupFiles {
    readAudio(id: string): Promise<string | null>;
    readPhoto(id: string): Promise<string | null>;
    writeAudio(id: string, base64: string): Promise<void>;
    writePhoto(id: string, base64: string): Promise<void>;
    audioUri(id: string): string;
    photoUri(id: string): string;
}

/** Las tablas en orden de dependencia: se borra al revés y se inserta así. */
export const BACKUP_TABLES: readonly LocalTable[] = ALL_LOCAL_TABLES;
