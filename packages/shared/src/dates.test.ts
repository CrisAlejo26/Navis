import { describe, expect, it } from 'vitest';

import {
  addDays,
  addMonths,
  daysBetween,
  eachDay,
  endOfMonth,
  monthGrid,
  startOfWeek,
  todayIn,
  weekdayOf,
} from './dates';

describe('aritmética de días del calendario', () => {
  it('suma días cruzando el cambio de mes', () => {
    expect(addDays('2026-08-30', 3)).toBe('2026-09-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('no se mueve de día al cruzar el cambio de horario de verano', () => {
    // En Europa el reloj se adelanta la madrugada del 29 de marzo de 2026: si
    // esto se calculase en hora local, el día siguiente saldría el mismo día.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
  });

  it('sabe qué día de la semana es, con domingo en 0', () => {
    expect(weekdayOf('2026-08-15')).toBe(6);
    expect(weekdayOf('2026-08-16')).toBe(0);
  });

  it('cuenta los días entre dos fechas en los dos sentidos', () => {
    expect(daysBetween('2026-08-01', '2026-08-31')).toBe(30);
    expect(daysBetween('2026-08-31', '2026-08-01')).toBe(-30);
  });

  it('devuelve el tramo completo con los extremos incluidos', () => {
    expect(eachDay('2026-08-01', '2026-08-03')).toEqual(['2026-08-01', '2026-08-02', '2026-08-03']);
    expect(eachDay('2026-08-03', '2026-08-01')).toEqual([]);
  });

  it('empieza la semana en lunes', () => {
    expect(startOfWeek('2026-08-16')).toBe('2026-08-10');
    expect(startOfWeek('2026-08-10')).toBe('2026-08-10');
  });

  it('encuentra el último día del mes, también en febrero bisiesto', () => {
    expect(endOfMonth('2026-08-15')).toBe('2026-08-31');
    expect(endOfMonth('2028-02-05')).toBe('2028-02-29');
  });

  it('salta de mes sin colarse en el 31', () => {
    expect(addMonths('2026-08-31', 1)).toBe('2026-09-01');
    expect(addMonths('2026-01-15', -1)).toBe('2025-12-01');
  });

  it('encuadra el mes en semanas completas', () => {
    expect(monthGrid('2026-08-15')).toEqual({ from: '2026-07-27', to: '2026-09-06' });
  });

  it('resuelve hoy en la zona de la iglesia y aguanta una zona inválida', () => {
    const nochevieja = new Date('2026-12-31T23:30:00Z');
    expect(todayIn('Europe/Madrid', nochevieja)).toBe('2027-01-01');
    expect(todayIn('America/Bogota', nochevieja)).toBe('2026-12-31');
    expect(todayIn('Marte/Olympus', nochevieja)).toBe('2026-12-31');
  });
});
