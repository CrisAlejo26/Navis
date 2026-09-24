import { toSearchName } from '@navis/shared';

/** `navis-elda-2026-08-15.png`: se entiende sin abrirlo (el de la web). */
export function posterFileName(
    from: string,
    to: string,
    congregation?: string,
    extension = 'png',
): string {
    const sede = congregation ? `-${slugify(congregation)}` : '';

    return `navis${sede}-${from}${from === to ? '' : `_${to}`}.${extension}`;
}

function slugify(name: string): string {
    return toSearchName(name)
        .replaceAll(' ', '-')
        .replace(/^-+|-+$/g, '');
}
