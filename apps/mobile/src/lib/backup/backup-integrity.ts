import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

import type { Backup } from './backup-format';

/**
 * Integridad de una copia v2. El manifiesto dice qué debería haber (filas por
 * tabla, cada fichero con su tamaño y su huella) y `integrity` es la huella de
 * todo el contenido: restaurar una copia truncada, editada a mano o sin alguno
 * de sus ficheros se detecta antes de tocar nada, en vez de descubrirse meses
 * después.
 */
export const sha256Hex = (text: string): string =>
    bytesToHex(sha256(new TextEncoder().encode(text)));

type Content = Pick<Backup, 'tables' | 'audios' | 'photos' | 'tableKeys'>;

/** La huella de todo el contenido, en el orden en que se escribió (JSON conserva el orden de claves). */
export function contentHash(content: Content): string {
    return sha256Hex(
        JSON.stringify({
            tables: content.tables,
            audios: content.audios,
            photos: content.photos,
            tableKeys: content.tableKeys ?? null,
        }),
    );
}

function describeFiles(files: Record<string, string>) {
    return Object.entries(files).map(([id, base64]) => ({
        id,
        bytes: base64.length,
        sha256: sha256Hex(base64),
    }));
}

export interface MissingFiles {
    audios: string[];
    photos: string[];
}

export function buildManifest(content: Content, missing: MissingFiles) {
    return {
        tables: Object.fromEntries(
            Object.entries(content.tables).map(([name, rows]) => [name, rows.length]),
        ),
        audios: describeFiles(content.audios),
        photos: describeFiles(content.photos),
        missing,
    };
}

export interface IntegrityReport {
    ok: boolean;
    /** Qué no cuadra, en lenguaje de desarrollo: sirve para el log, no para la pantalla. */
    problems: string[];
    missing: MissingFiles;
}

const NONE: MissingFiles = { audios: [], photos: [] };

/** Comprueba una copia contra su propio manifiesto. Una v1 no trae manifiesto: no hay nada que comprobar. */
export function verifyIntegrity(backup: Backup): IntegrityReport {
    const { manifest, integrity } = backup;
    if (backup.version === 1 || !manifest || !integrity) {
        return { ok: true, problems: [], missing: NONE };
    }

    const problems: string[] = [];
    if (contentHash(backup) !== integrity) problems.push('huella del contenido');

    for (const [name, count] of Object.entries(manifest.tables)) {
        if ((backup.tables[name]?.length ?? 0) !== count) problems.push(`filas de ${name}`);
    }
    for (const kind of ['audios', 'photos'] as const) {
        for (const file of manifest[kind]) {
            const content = backup[kind][file.id];
            if (content === undefined || sha256Hex(content) !== file.sha256) {
                problems.push(`fichero ${kind}/${file.id}`);
            }
        }
    }
    return { ok: problems.length === 0, problems, missing: manifest.missing };
}
