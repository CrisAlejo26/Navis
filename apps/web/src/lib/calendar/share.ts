import { slugify } from '@/lib/share/files';

/**
 * `navis-elda-2026-08-15.png`: se entiende sin abrirlo.
 *
 * Es lo único que quedó aquí cuando el resto del juego de compartir —mandar,
 * copiar, descargar y rasterizar— se fue a `lib/share` para que lo usaran
 * también las exportaciones (RFC 0009). Esto sí es del calendario: un tramo de
 * fechas y una sede.
 */
export function posterFileName(
  from: string,
  to: string,
  congregation?: string,
  extension = 'png',
): string {
  const sede = congregation ? `-${slugify(congregation)}` : '';

  return `navis${sede}-${from}${from === to ? '' : `_${to}`}.${extension}`;
}
