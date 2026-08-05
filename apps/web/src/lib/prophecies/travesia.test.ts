import type { ProphecyListItem } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { percentOf, positionOf, trackOf, travesiaRange } from '@/lib/prophecies/travesia';

const HOY = '2026-08-05';

const palabra = (overrides: Partial<ProphecyListItem> = {}): ProphecyListItem => ({
  id: 'p1',
  title: 'La casa',
  excerpt: 'Vi una casa junto al mar',
  receivedAt: '2026-01-01',
  fulfilledAt: null,
  lastFulfillmentAt: null,
  state: 'espera',
  waitingDays: 216,
  fulfillmentsCount: 0,
  fulfillmentDays: [],
  ...overrides,
});

describe('el eje de la travesía', () => {
  it('va de la palabra más antigua hasta hoy, no desde el año cero', () => {
    // Con un tramo fijo, todos los trayectos caerían apelotonados a la derecha.
    const range = travesiaRange(
      [palabra({ receivedAt: '2021-06-01' }), palabra({ id: 'p2', receivedAt: '2019-03-14' })],
      HOY,
    );

    expect(range.from).toBe('2019-03-14');
    expect(range.to).toBe(HOY);
  });

  it('rotula todos los años del tramo, incluidos los que no tienen ninguna', () => {
    const range = travesiaRange([palabra({ receivedAt: '2023-05-01' })], HOY);

    expect(range.years).toEqual([2023, 2024, 2025, 2026]);
  });

  it('sin ninguna palabra el eje se queda en hoy y no revienta', () => {
    const range = travesiaRange([], HOY);

    expect(range.from).toBe(HOY);
    expect(range.years).toEqual([2026]);
  });
});

describe('dónde cae un día en el eje', () => {
  const range = travesiaRange([palabra({ receivedAt: '2026-01-01' })], '2026-12-31');

  it('el primer día está al principio y hoy al final', () => {
    expect(positionOf('2026-01-01', range)).toBe(0);
    expect(positionOf('2026-12-31', range)).toBe(1);
  });

  it('recorta lo que se sale del tramo por cualquiera de los dos lados', () => {
    // Una fecha en el futuro se acepta (D7), pero no puede pintarse fuera.
    expect(positionOf('2030-01-01', range)).toBe(1);
    expect(positionOf('2001-01-01', range)).toBe(0);
  });

  it('lo devuelve como porcentaje para poder ponerlo en un `style`', () => {
    expect(percentOf('2026-01-01', range)).toBe('0%');
    expect(percentOf('2026-12-31', range)).toBe('100%');
  });
});

describe('el trayecto de una palabra', () => {
  const range = travesiaRange([palabra({ receivedAt: '2026-01-01' })], '2026-12-31');

  it('la que sigue abierta llega hasta hoy y se marca como tal', () => {
    const track = trackOf(palabra({ receivedAt: '2026-01-01' }), range);

    expect(track.left).toBe('0%');
    expect(track.width).toBe('100%');
    expect(track.open).toBe(true);
  });

  it('la cumplida se cierra el día que se cumplió', () => {
    const track = trackOf(palabra({ receivedAt: '2026-01-01', fulfilledAt: '2026-07-01' }), range);

    expect(track.open).toBe(false);
    expect(Number.parseFloat(track.width)).toBeGreaterThan(45);
    expect(Number.parseFloat(track.width)).toBeLessThan(55);
  });

  it('un trayecto de un solo día se ve igualmente', () => {
    // Sin ancho mínimo, una recibida y cumplida el mismo día desaparecería.
    const track = trackOf(palabra({ receivedAt: '2026-06-01', fulfilledAt: '2026-06-01' }), range);

    expect(Number.parseFloat(track.width)).toBeGreaterThan(0);
  });
});
