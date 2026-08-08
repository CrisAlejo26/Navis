import { describe, expect, it } from 'vitest';

import { matchesQuery } from '@/lib/geo/match';

describe('matchesQuery', () => {
  it('sin nada escrito, todo coincide', () => {
    expect(matchesQuery('España', 'ES', '')).toBe(true);
  });

  it('coincide por el nombre, sin importar mayúsculas ni acentos', () => {
    expect(matchesQuery('Almería', undefined, 'almeria')).toBe(true);
    expect(matchesQuery('Almería', undefined, 'ALMER')).toBe(true);
  });

  it('coincide por el código cuando el nombre no encaja', () => {
    expect(matchesQuery('España', 'ES', 'es')).toBe(true);
  });

  it('no coincide si ni el nombre ni el código lo contienen', () => {
    expect(matchesQuery('España', 'ES', 'francia')).toBe(false);
  });
});
