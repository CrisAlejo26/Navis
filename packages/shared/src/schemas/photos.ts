/**
 * Lo que se acepta como fotografía de un creyente.
 *
 * Los cuatro formatos que sale de una cámara o de una galería. Nada de `svg`:
 * un SVG es un documento con scripts dentro, y servirlo desde el mismo origen
 * sería abrirle la puerta a cualquiera que pueda subir uno.
 */
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as const;

export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number];

export function isImageMimeType(value: string): value is ImageMimeType {
  const base = value.split(';')[0]?.trim().toLowerCase() ?? '';
  return (IMAGE_MIME_TYPES as readonly string[]).includes(base);
}

/**
 * Tope de una fotografía, en bytes.
 *
 * Ocho megas son de sobra para una foto de móvil sin recortar. Más que eso no
 * es un retrato: es un archivo que alguien ha arrastrado sin mirar, y engorda
 * las copias de seguridad para nada.
 */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** La extensión con la que se guarda cada tipo. Nunca la que diga el cliente. */
export const IMAGE_EXTENSIONS: Record<ImageMimeType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
};

/** De dónde la descarga la interfaz. Un solo sitio que lo diga (Regla 1). */
export function believerPhotoPath(believerId: string): string {
  return `/believer-photos/${believerId}`;
}
