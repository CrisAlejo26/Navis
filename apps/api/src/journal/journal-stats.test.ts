import { describe, expect, it } from 'vitest';

import { monthlyGrid, summarize, type StatsRow } from './journal-stats';

const HOY = '2026-08-05';

const fila = (overrides: Partial<StatsRow> = {}): StatsRow => ({
  kind: 'observacion',
  occurredAt: '2026-08-01',
  remindAt: null,
  remindDoneAt: null,
  ...overrides,
});

describe('las cuentas de la portada del cuaderno', () => {
  it('reparte las entradas entre sus tipos', () => {
    const stats = summarize(
      [fila({ kind: 'oracion' }), fila({ kind: 'oracion' }), fila({ kind: 'decision' })],
      HOY,
    );

    expect(stats.total).toBe(3);
    expect(stats.byKind.oracion).toBe(2);
    expect(stats.byKind.decision).toBe(1);
    expect(stats.byKind.testimonio).toBe(0);
  });

  it('cuenta un recordatorio sin atender aunque todavía no haya vencido', () => {
    const stats = summarize(
      [
        fila({ remindAt: '2099-01-01T19:00:00.000Z' }),
        fila({ remindAt: '2020-01-01T19:00:00.000Z', remindDoneAt: '2020-01-02T00:00:00.000Z' }),
        fila(),
      ],
      HOY,
    );

    // Uno pendiente, uno ya atendido y uno sin recordatorio: solo el primero cuenta.
    expect(stats.pendingReminders).toBe(1);
  });

  it('cuenta solo las entradas del mes de hoy', () => {
    const stats = summarize(
      [fila({ occurredAt: '2026-08-01' }), fila({ occurredAt: '2026-07-31' })],
      HOY,
    );

    expect(stats.thisMonth).toBe(1);
  });
});

describe('el gráfico mensual del cuaderno', () => {
  it('trae doce meses, terminando en el mes de hoy, con los vacíos a cero', () => {
    const grid = monthlyGrid([fila({ occurredAt: '2026-03-14' })], HOY);

    expect(grid).toHaveLength(12);
    expect(grid[0].month).toBe('2025-09');
    expect(grid[11].month).toBe('2026-08');
    expect(grid.find((month) => month.month === '2026-03')?.total).toBe(1);
    expect(grid.find((month) => month.month === '2026-04')).toEqual({
      month: '2026-04',
      total: 0,
    });
  });

  it('deja fuera lo que cae antes de la ventana de doce meses', () => {
    const grid = monthlyGrid([fila({ occurredAt: '2019-01-05' })], HOY);

    expect(grid.every((month) => month.total === 0)).toBe(true);
  });
});
