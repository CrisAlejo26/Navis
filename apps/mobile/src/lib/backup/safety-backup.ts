import { inspectBackup } from './restore-backup';
import { buildBackup } from './create-backup';
import type { BackupFiles, BackupOrigin } from './backup-format';

export type SafetyReason = 'connect' | 'merge' | 'disconnect' | 'restore';

/** Lo que el sistema de ficheros del teléfono sabe hacer con las copias previas. */
export interface SafetyStore {
    write(name: string, text: string): Promise<void>;
    read(name: string): Promise<string | null>;
    list(): Promise<string[]>;
    remove(name: string): Promise<void>;
    uri(name: string): string;
}

export interface SafetyCopy {
    name: string;
    uri: string;
    createdAt: string;
    reason: SafetyReason;
}

/** No se pudo dejar una copia verificada: la operación que la pedía no debe seguir. */
export class SafetyBackupError extends Error {}

/** Cuántas se guardan: lo bastante para volver atrás una operación y la anterior, sin llenar el teléfono. */
export const SAFETY_KEEP = 5;

const nameOf = (createdAt: string, reason: SafetyReason): string =>
    `${createdAt.replace(/[:.]/g, '-')}-${reason}.json`;

/**
 * Una copia previa a conectar, fusionar, desconectar o restaurar. Se guarda en el
 * almacenamiento privado de la app (mismo nivel de protección que la base de
 * datos), **sin** claves portables, y solo se da por buena si se vuelve a leer y
 * pasa la misma comprobación que una restauración: forma, versión e integridad.
 * Para llevarla fuera del teléfono se usa la exportación normal, con contraseña.
 */
export async function createSafetyBackup(
    reason: SafetyReason,
    files: BackupFiles,
    store: SafetyStore,
    origin?: BackupOrigin,
): Promise<SafetyCopy> {
    const backup = await buildBackup(files, undefined, { origin, portableKeys: false });
    const name = nameOf(backup.createdAt, reason);
    try {
        await store.write(name, JSON.stringify(backup));
        const written = await store.read(name);
        if (written === null) throw new SafetyBackupError('unreadable');
        await inspectBackup(written);
    } catch (error) {
        await store.remove(name).catch(() => undefined);
        throw error instanceof SafetyBackupError ? error : new SafetyBackupError('unverified');
    }

    const stale = (await store.list()).sort().slice(0, -SAFETY_KEEP);
    for (const old of stale) await store.remove(old);

    return { name, uri: store.uri(name), createdAt: backup.createdAt, reason };
}
