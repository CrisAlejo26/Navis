import type { DreamEmotionCount } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { summarize, STRIP_WEEKS, type DreamStatsRow } from './dream-stats';

/** Un miércoles, para que la semana en curso no empiece ni acabe en el borde. */
const HOY = '2026-08-05';

const fila = (dreamedAt: string, overrides: Partial<DreamStatsRow> = {}): DreamStatsRow => ({
  id: `d-${dreamedAt}`,
  title: null,
  dreamedAt,
  fulfilledAt: null,
  ...overrides,
});

const emocion = (id: string, count: number): DreamEmotionCount => ({
  id,
  slug: null,
  name: id,
  accent: '#2140cf',
  position: 100,
  count,
});

describe('la franja de noches (D19)', () => {
  it('trae doce semanas completas, de lunes a domingo', () => {
    const stats = summarize([], HOY, []);

    expect(stats.nights).toHaveLength(STRIP_WEEKS * 7);
    expect(stats.nights[0]?.day).toBe('2026-05-18');
    expect(stats.nights.at(-1)?.day).toBe('2026-08-09');
    expect(stats.weeks).toHaveLength(STRIP_WEEKS);
  });

  /* La rejilla se pinta rectangular: si la última columna acabase hoy, las
     celdas que faltan se leerían como un fallo de pintado. */
  it('llega hasta el domingo aunque todavía no haya pasado', () => {
    const stats = summarize([fila(HOY)], HOY, []);

    expect(stats.nights.at(-1)).toEqual({ day: '2026-08-09', count: 0 });
  });

  it('cuenta varias noches iguales en la misma celda', () => {
    const stats = summarize([fila(HOY), fila(HOY), fila('2026-08-04')], HOY, []);

    expect(stats.nights.find((night) => night.day === HOY)?.count).toBe(2);
  });

  it('la semana es la suma de sus noches', () => {
    const stats = summarize([fila(HOY), fila('2026-08-04'), fila('2026-08-03')], HOY, []);

    expect(stats.weeks.at(-1)).toEqual({ weekStart: '2026-08-03', count: 3 });
  });

  it('deja fuera lo que se soñó antes de la franja', () => {
    const stats = summarize([fila('2026-01-01')], HOY, []);

    expect(stats.total).toBe(1);
    expect(stats.nights.every((night) => night.count === 0)).toBe(true);
  });
});

describe('las cuentas de arriba', () => {
  it('separa el mes, la semana y los cumplidos', () => {
    const stats = summarize(
      [
        fila(HOY),
        fila('2026-08-01'),
        fila('2026-07-30', { fulfilledAt: '2026-08-02' }),
        fila('2026-06-01'),
      ],
      HOY,
      [],
    );

    expect(stats.total).toBe(4);
    expect(stats.thisMonth).toBe(2);
    expect(stats.thisWeek).toBe(1);
    expect(stats.fulfilled).toBe(1);
  });

  it('el último cumplido es el de la fecha más reciente, no el último apuntado', () => {
    const stats = summarize(
      [
        fila('2026-01-10', { id: 'viejo', title: 'Viejo', fulfilledAt: '2026-07-01' }),
        fila('2026-02-10', { id: 'nuevo', title: 'Nuevo', fulfilledAt: '2026-08-02' }),
      ],
      HOY,
      [],
    );

    expect(stats.lastFulfilled).toEqual({
      id: 'nuevo',
      title: 'Nuevo',
      fulfilledAt: '2026-08-02',
    });
  });

  it('sin nada cumplido, el último es nulo y no un hueco', () => {
    expect(summarize([fila(HOY)], HOY, []).lastFulfilled).toBeNull();
  });
});

describe('el reparto por día de la semana (D14)', () => {
  it('devuelve los siete días, con domingo el primero', () => {
    // 2026-08-05 es miércoles; 2026-08-09, domingo.
    const stats = summarize([fila(HOY), fila('2026-08-09')], HOY, []);

    expect(stats.byWeekday).toHaveLength(7);
    expect(stats.byWeekday[3]).toEqual({ weekday: 3, count: 1 });
    expect(stats.byWeekday[0]).toEqual({ weekday: 0, count: 1 });
    expect(stats.byWeekday[1]).toEqual({ weekday: 1, count: 0 });
  });
});

describe('la racha', () => {
  it('cuenta las noches seguidas hacia atrás', () => {
    const stats = summarize([fila(HOY), fila('2026-08-04'), fila('2026-08-03')], HOY, []);

    expect(stats.streak).toBe(3);
  });

  /* Regresión: contando solo desde hoy, la racha se caía a cero cada mañana y
     volvía a subir por la noche, que no es lo que significa una racha. */
  it('empieza en ayer si hoy todavía no hay nada apuntado', () => {
    const stats = summarize([fila('2026-08-04'), fila('2026-08-03')], HOY, []);

    expect(stats.streak).toBe(2);
  });

  it('se corta en el primer hueco', () => {
    const stats = summarize([fila(HOY), fila('2026-08-01')], HOY, []);

    expect(stats.streak).toBe(1);
  });

  it('es cero cuando no hay nada', () => {
    expect(summarize([], HOY, []).streak).toBe(0);
  });
});

describe('el mapa de emociones', () => {
  it('sale de más a menos, que es como se pinta la barra', () => {
    const stats = summarize([fila(HOY)], HOY, [emocion('poca', 2), emocion('mucha', 9)]);

    expect(stats.byEmotion.map((one) => one.id)).toEqual(['mucha', 'poca']);
  });
});

describe('la línea de los doce meses', () => {
  it('trae los doce, con los vacíos a cero y el mes en curso al final', () => {
    const stats = summarize([fila(HOY), fila('2026-08-01'), fila('2025-09-15')], HOY, []);

    expect(stats.monthly).toHaveLength(12);
    expect(stats.monthly.at(-1)).toEqual({ month: '2026-08', count: 2 });
    expect(stats.monthly[0]).toEqual({ month: '2025-09', count: 1 });
  });
});
