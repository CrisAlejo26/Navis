import type { PublicList } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { shareDescription } from './share-description';

type Lista = Pick<PublicList, 'members' | 'updatedAt'>;

function conPersonas(total: number, updatedAt = '2026-08-03T10:00:00.000Z'): Lista {
  return {
    updatedAt,
    members: Array.from({ length: total }, (_, position) => ({
      position,
      name: `Persona ${position + 1}`,
      note: null,
      congregation: null,
      ministry: null,
      photoId: null,
    })),
  };
}

describe('la descripción de la tarjeta', () => {
  it('habla de esta lista y no del producto: cuántas personas y de cuándo es', () => {
    expect(shareDescription({ description: null, list: conPersonas(8) })).toBe(
      'Lista de 8 personas, compartida con Navis. Actualizada el 3 de agosto.',
    );
  });

  it('concuerda en singular con una sola persona', () => {
    expect(shareDescription({ description: null, list: conPersonas(1) })).toContain(
      'Lista de 1 persona,',
    );
  });

  it('dice que está vacía en vez de anunciar cero personas', () => {
    expect(shareDescription({ description: null, list: conPersonas(0) })).toContain(
      'Lista todavía sin nadie',
    );
  });

  it('en una restringida no cuenta a nadie ni dice de cuándo es (D18)', () => {
    const texto = shareDescription({ description: null, list: null });

    expect(texto).toBe('Lista compartida con Navis. Hace falta un acceso para verla.');
    expect(texto).not.toMatch(/\d/);
  });

  it('la descripción que escribió su dueño manda, y también en una restringida', () => {
    expect(shareDescription({ description: 'Quién predica este mes', list: conPersonas(8) })).toBe(
      'Quién predica este mes',
    );
    expect(shareDescription({ description: 'Quién predica este mes', list: null })).toBe(
      'Quién predica este mes',
    );
  });

  it('una descripción en blanco no deja la tarjeta muda', () => {
    expect(shareDescription({ description: '   ', list: conPersonas(3) })).toContain('3 personas');
  });

  /*
   * Regresión: el día se formatea en UTC. Con la hora local del contenedor,
   * esta misma lista diría «2 de agosto» en cualquier huso al oeste de
   * Greenwich — la pareja de la trampa de `iso-day.ts`.
   */
  it('formatea el día en UTC, no en el huso del servidor', () => {
    const texto = shareDescription({
      description: null,
      list: conPersonas(2, '2026-08-03T00:30:00Z'),
    });

    expect(texto).toContain('el 3 de agosto');
  });

  it('se queda con el recuento si la fecha no vale, en vez de escribir «Invalid Date»', () => {
    const texto = shareDescription({ description: null, list: conPersonas(2, 'no es una fecha') });

    expect(texto).toBe('Lista de 2 personas, compartida con Navis.');
  });
});
