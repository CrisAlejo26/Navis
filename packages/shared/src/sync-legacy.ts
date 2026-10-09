import type { LocalRow } from './sync-codec';

/**
 * Puente para `believers.featured_tag_id`, la columna heredada del móvil. En la
 * API el destacado es `believer_tag_links.featured` (un solo vínculo por
 * creyente); en el teléfono, hoy, vive en la ficha y los vínculos llevan
 * `featured = 0` siempre. El protocolo habla el lenguaje de la API: estas dos
 * funciones traducen en cada sentido hasta que el móvil escriba `featured`
 * directamente (entonces se borran, igual que `LEGACY_COLUMNS` del backup).
 */

/** Teléfono → protocolo: marca como destacado el vínculo cuya etiqueta es la de la ficha. */
export function linksWithFeatured(
    links: readonly LocalRow[],
    featuredTagId: string | null,
): LocalRow[] {
    return links.map((link) => ({
        ...link,
        featured: featuredTagId !== null && link.tag_id === featuredTagId ? 1 : 0,
    }));
}

/** Protocolo → teléfono: la etiqueta destacada es la del primer vínculo marcado, o ninguna. */
export function featuredTagFromLinks(links: readonly LocalRow[]): string | null {
    const featured = links.find((link) => link.featured === 1 && link.deleted_at == null);
    return featured ? String(featured.tag_id) : null;
}
