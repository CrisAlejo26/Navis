import { describe, expect, it } from 'vitest';

import { churchIcon } from './church-icon';

describe('churchIcon', () => {
  it('el mismo id siempre da el mismo icono y el mismo tinte', () => {
    const primero = churchIcon('b2c13399-9776-4368-aec3-1b5f0037c534');
    const segundo = churchIcon('b2c13399-9776-4368-aec3-1b5f0037c534');

    expect(primero.Icon).toBe(segundo.Icon);
    expect(primero.tinte).toBe(segundo.tinte);
  });

  it('ids distintos reparten entre varios iconos y tintes', () => {
    const ids = [
      '23e520d4-ea8c-435f-a6a8-34498db39921',
      'b2c13399-9776-4368-aec3-1b5f0037c534',
      '98e77932-3e75-4f7e-b51e-75138340a12c',
      '68ce5c34-9378-4b5d-9090-7cdc5fb2d8d0',
      '3a043b5a-82e0-4d0b-b3f1-bfff810b0a4f',
      'c1',
      'c2',
      'c3',
      'c4',
      'c5',
      'c6',
      'c7',
      'c8',
    ];

    const iconos = new Set(ids.map((id) => churchIcon(id).Icon));
    const tintes = new Set(ids.map((id) => churchIcon(id).tinte));

    expect(iconos.size).toBeGreaterThan(1);
    expect(tintes.size).toBeGreaterThan(1);
  });

  it('el tinte siempre cae dentro de los seis definidos en tokens.css', () => {
    const ids = Array.from({ length: 30 }, (_, i) => `iglesia-${String(i)}`);

    for (const id of ids) {
      const { tinte } = churchIcon(id);
      expect(tinte).toBeGreaterThanOrEqual(1);
      expect(tinte).toBeLessThanOrEqual(6);
    }
  });
});
