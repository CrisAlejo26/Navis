/** Los dos formatos de la lámina y el ancho real de cada uno, que es el del PNG. */
export type PosterAspect = 'portrait' | 'landscape';

export const POSTER_WIDTH: Record<PosterAspect, number> = { portrait: 1080, landscape: 1680 };
