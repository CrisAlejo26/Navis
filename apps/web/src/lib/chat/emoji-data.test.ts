import { describe, expect, it } from 'vitest';

import { EMOJI_CATEGORIES, searchEmoji } from './emoji-data';

describe('EMOJI_CATEGORIES', () => {
  it('agrupa por categoría, con al menos un emoji en cada una', () => {
    expect(EMOJI_CATEGORIES.length).toBeGreaterThan(0);
    for (const category of EMOJI_CATEGORIES) {
      expect(category.emojis.length).toBeGreaterThan(0);
      expect(category.labelKey).toMatch(/^communications\.emojiCategories\./);
    }
  });

  it('trae las nueve categorías de Unicode', () => {
    expect(EMOJI_CATEGORIES.length).toBe(9);
  });
});

describe('searchEmoji', () => {
  it('encuentra por nombre parcial', () => {
    expect(searchEmoji('heart')).toContain('❤️');
  });

  it('sin texto de búsqueda, no hay resultados', () => {
    expect(searchEmoji('')).toEqual([]);
    expect(searchEmoji('   ')).toEqual([]);
  });

  it('un nombre que no existe no encuentra nada', () => {
    expect(searchEmoji('esto-no-es-un-emoji-de-verdad')).toEqual([]);
  });
});
