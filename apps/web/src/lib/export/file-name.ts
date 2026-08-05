import { todayIn } from '@navis/shared';

import { slugify } from '@/lib/share/files';

/**
 * `navis-creyentes-elda-2026-08-05.xlsx`: se entiende sin abrirlo y ordena solo
 * por fecha (RFC 0009 §7.5).
 *
 * Sin acentos ni espacios, que se convierten en `%20` en cuanto el fichero
 * viaja por algún sitio. La fecha es la de **quien exporta**, no la del
 * servidor: es el día que va a buscar en su carpeta de descargas.
 */
export function exportFileName(label: string, extension: string, hint?: string): string {
  const hoy = todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const partes = ['navis', slugify(label), hint ? slugify(hint) : '', hoy].filter(Boolean);

  return `${partes.join('-')}.${extension}`;
}
