export const CHURCH_ICONS = [
    'anchor',
    'compass',
    'sailboat',
    'ship',
    'ship-wheel',
    'waves',
    'wind',
    'navigation',
    'map',
    'sunrise',
    'telescope',
    'route',
] as const;
export type ChurchIcon = (typeof CHURCH_ICONS)[number];
export type ChurchTint = 1 | 2 | 3 | 4 | 5 | 6;

/** Mantiene el hash original de la web: un id conserva su emblema para siempre. */
export function churchEmblem(id: string): { icon: ChurchIcon; tint: ChurchTint } {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
    hash = Math.abs(hash);
    return {
        icon: CHURCH_ICONS[hash % CHURCH_ICONS.length],
        tint: ((hash % 6) + 1) as ChurchTint,
    };
}
