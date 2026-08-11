import dataByGroup from 'unicode-emoji-json/data-by-group.json';

/**
 * Fuente de datos para el selector de emoji del compositor (RFC 0019 §2):
 * un paquete de solo datos (`unicode-emoji-json`), sin interfaz — la interfaz
 * es de Navis, en `emoji-picker.tsx`. Las categorías y el orden dentro de
 * cada una son los que ya usa unicode.org, los mismos que cualquier selector
 * de sistema operativo: no hay uno propio que inventar.
 */
export interface EmojiCategory {
  slug: string;
  /** Clave de traducción bajo `communications.emojiCategories.*`. */
  labelKey: string;
  emojis: string[];
}

interface EmojiEntry {
  emoji: string;
  name: string;
  slug: string;
}

/** `smileys_emotion` (el `slug` del paquete) → `smileysEmotion` (camelCase de Regla 2). */
const CATEGORY_LABEL_KEYS: Record<string, string> = {
  smileys_emotion: 'smileysEmotion',
  people_body: 'peopleBody',
  animals_nature: 'animalsNature',
  food_drink: 'foodDrink',
  travel_places: 'travelPlaces',
  activities: 'activities',
  objects: 'objects',
  symbols: 'symbols',
  flags: 'flags',
};

export const EMOJI_CATEGORIES: readonly EmojiCategory[] = dataByGroup.map((group) => ({
  slug: group.slug,
  labelKey: `communications.emojiCategories.${CATEGORY_LABEL_KEYS[group.slug] ?? group.slug}`,
  emojis: group.emojis.map((entry) => entry.emoji),
}));

const ALL_EMOJI: readonly EmojiEntry[] = dataByGroup.flatMap((group) =>
  group.emojis.map((entry) => ({ emoji: entry.emoji, name: entry.name, slug: entry.slug })),
);

/**
 * Busca por el nombre en inglés de Unicode: es el único nombre que trae el
 * paquete, no hay una versión en los seis idiomas (RFC 0019 §2). Suficiente
 * para "corazón" o "heart" en el idioma en que ya está escrito el nombre.
 */
export function searchEmoji(query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  return ALL_EMOJI.filter(
    (entry) => entry.name.includes(needle) || entry.slug.includes(needle),
  ).map((entry) => entry.emoji);
}
