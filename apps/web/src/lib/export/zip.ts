import { buildZipBytes, type ZipEntry } from '@navis/shared';
export { crc32, utf8, type ZipEntry } from '@navis/shared';
export function buildZip(entries: readonly ZipEntry[], mimeType: string): Blob {
    return new Blob([buildZipBytes(entries)], { type: mimeType });
}
