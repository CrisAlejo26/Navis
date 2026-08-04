import { describe, expect, it } from 'vitest';

import { effectiveRange, isCalendarView, rangeFor, stepAnchor } from './view-range';

describe('el tramo de cada vista del calendario', () => {
  it('el mes se pide encuadrado en semanas completas', () => {
    expect(rangeFor('month', '2026-08-15')).toEqual({ from: '2026-07-27', to: '2026-09-06' });
  });

  it('la semana empieza en lunes', () => {
    expect(rangeFor('week', '2026-08-15')).toEqual({ from: '2026-08-10', to: '2026-08-16' });
  });

  it('la agenda abarca cuatro semanas desde la fecha ancla', () => {
    expect(rangeFor('agenda', '2026-08-15')).toEqual({ from: '2026-08-15', to: '2026-09-11' });
  });

  it('personas mira lo mismo que el mes: es la misma información girada', () => {
    expect(rangeFor('people', '2026-08-15')).toEqual(rangeFor('month', '2026-08-15'));
  });

  it('anterior y siguiente mueven un paso del tamaño de la vista', () => {
    expect(stepAnchor('month', '2026-08-15', 1)).toBe('2026-09-01');
    expect(stepAnchor('week', '2026-08-15', -1)).toBe('2026-08-08');
    expect(stepAnchor('agenda', '2026-08-15', 1)).toBe('2026-09-12');
  });

  it('un rango elegido a mano manda sobre el de la vista', () => {
    const aMano = { from: '2026-08-10', to: '2026-08-23' };

    expect(effectiveRange('month', '2026-08-15', aMano)).toEqual(aMano);
    expect(effectiveRange('month', '2026-08-15', null)).toEqual(rangeFor('month', '2026-08-15'));
  });

  it('solo acepta las cuatro vistas que existen', () => {
    expect(isCalendarView('week')).toBe(true);
    expect(isCalendarView('gantt')).toBe(false);
  });
});
