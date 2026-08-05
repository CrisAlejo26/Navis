import { describe, expect, it } from 'vitest';

import { median, monthlyGrid, summarize, type StatsRow } from './prophecy-stats';

const HOY = '2026-08-05';

const fila = (overrides: Partial<StatsRow> = {}): StatsRow => ({
  id: 'p1',
  title: 'La casa',
  receivedAt: '2026-03-14',
  fulfilledAt: null,
  lastFulfillmentAt: null,
  ...overrides,
});

describe('las cuentas de la portada', () => {
  it('reparte las profecías entre los tres estados', () => {
    const stats = summarize(
      [
        fila({ id: 'a' }),
        fila({ id: 'b', lastFulfillmentAt: '2026-05-02' }),
        fila({ id: 'c', fulfilledAt: '2026-06-20' }),
      ],
      HOY,
    );

    expect(stats.total).toBe(3);
    expect(stats.byState).toEqual({ espera: 1, camino: 1, cumplida: 1 });
  });

  it('sin ninguna profecía, la tasa es nula y no cero', () => {
    // Cero por ciento y «todavía no hay nada» son cosas distintas: la portada
    // enseña una invitación en vez de seis ceros (§6.2).
    const stats = summarize([], HOY);

    expect(stats.total).toBe(0);
    expect(stats.fulfillmentRate).toBeNull();
    expect(stats.medianWaitingDays).toBeNull();
    expect(stats.longestWaiting).toBeNull();
  });

  it('cuenta lo recibido y lo cumplido de este año, y no de otros', () => {
    const stats = summarize(
      [
        fila({ id: 'a', receivedAt: '2025-11-02', fulfilledAt: '2026-02-10' }),
        fila({ id: 'b', receivedAt: '2026-01-20' }),
      ],
      HOY,
    );

    expect(stats.receivedThisYear).toBe(1);
    expect(stats.fulfilledThisYear).toBe(1);
  });

  it('la que más lleva esperando es la abierta más antigua, no la cumplida', () => {
    const stats = summarize(
      [
        fila({ id: 'vieja-cumplida', receivedAt: '2019-01-01', fulfilledAt: '2026-01-01' }),
        fila({ id: 'abierta', title: 'El ministerio', receivedAt: '2021-06-01' }),
      ],
      HOY,
    );

    expect(stats.longestWaiting?.id).toBe('abierta');
    expect(stats.longestWaiting?.title).toBe('El ministerio');
  });
});

describe('la mediana de la espera', () => {
  it('no se desplaza con un valor extremo, como haría la media', () => {
    // Media: 1.503 días. Mediana: 10. La segunda describe el caso normal.
    expect(median([5, 10, 15, 5980])).toBe(13);
    expect(median([5, 10, 15])).toBe(10);
  });

  it('es nula cuando no hay ninguna cumplida que medir', () => {
    expect(median([])).toBeNull();
  });

  it('solo cuenta las cumplidas: una abierta todavía no ha esperado su total', () => {
    const stats = summarize(
      [fila({ id: 'a', receivedAt: '2026-07-26', fulfilledAt: '2026-08-05' }), fila({ id: 'b' })],
      HOY,
    );

    expect(stats.medianWaitingDays).toBe(10);
  });
});

describe('el gráfico mensual', () => {
  it('trae doce meses, terminando en el mes de hoy', () => {
    const grid = monthlyGrid([], HOY);

    expect(grid).toHaveLength(12);
    expect(grid[0].month).toBe('2025-09');
    expect(grid[11].month).toBe('2026-08');
  });

  it('incluye los meses vacíos a cero, para no mentir sobre la forma', () => {
    // Sin ellos, dos meses separados por medio año se pintarían seguidos.
    const grid = monthlyGrid([fila({ receivedAt: '2026-03-14' })], HOY);

    expect(grid.find((month) => month.month === '2026-03')?.received).toBe(1);
    expect(grid.find((month) => month.month === '2026-04')).toEqual({
      month: '2026-04',
      received: 0,
      fulfilled: 0,
    });
  });

  it('cuenta lo recibido y lo cumplido en el mes que corresponde a cada uno', () => {
    const grid = monthlyGrid([fila({ receivedAt: '2026-03-14', fulfilledAt: '2026-06-20' })], HOY);

    expect(grid.find((month) => month.month === '2026-03')).toMatchObject({
      received: 1,
      fulfilled: 0,
    });
    expect(grid.find((month) => month.month === '2026-06')).toMatchObject({
      received: 0,
      fulfilled: 1,
    });
  });

  it('deja fuera lo que cae antes de la ventana de doce meses', () => {
    const grid = monthlyGrid([fila({ receivedAt: '2019-01-05' })], HOY);

    expect(grid.every((month) => month.received === 0)).toBe(true);
  });
});
