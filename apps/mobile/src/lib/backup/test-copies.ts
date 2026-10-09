import { buildManifest, contentHash } from './backup-integrity';
import type { Backup } from './backup-format';

/**
 * Ayudas de los tests de copias. Una copia v2 se comprueba contra su propio
 * manifiesto, así que un test que la retoque a mano (para simular una copia
 * antigua, o una manipulada) tiene que elegir qué quiere ser:
 */

/** Una copia como las de antes del manifiesto (v1): sin origen, manifiesto ni huella. */
export function asV1Copy(backup: Backup): Backup {
    const { origin: _origin, manifest: _manifest, integrity: _integrity, ...rest } = backup;
    return { ...rest, version: 1 };
}

/** Una copia v2 retocada pero **coherente**: recalcula manifiesto y huella, como haría quien la manipula. */
export function reseal(backup: Backup): Backup {
    const missing = backup.manifest?.missing ?? { audios: [], photos: [] };
    return {
        ...backup,
        manifest: buildManifest(backup, missing),
        integrity: contentHash(backup),
    };
}
