import { describe, expect, it } from 'vitest';

import { taskAppliesOn } from './task-recurrence';

const base = {
  date: '2026-08-01',
  isRecurring: false,
  repeatFreq: null,
  repeatInterval: 1,
  repeatEndType: null,
  repeatEndDate: null,
  repeatEndCount: null,
} as const;

describe('taskAppliesOn', () => {
  it('una tarea no repetitiva solo se propone su propio día', () => {
    expect(taskAppliesOn(base, '2026-08-01')).toBe(true);
    expect(taskAppliesOn(base, '2026-08-02')).toBe(false);
    expect(taskAppliesOn(base, '2026-07-31')).toBe(false);
  });

  it('una tarea diaria se propone cada día desde su fecha', () => {
    const daily = { ...base, isRecurring: true, repeatFreq: 'diaria' as const };
    expect(taskAppliesOn(daily, '2026-08-01')).toBe(true);
    expect(taskAppliesOn(daily, '2026-08-05')).toBe(true);
    expect(taskAppliesOn(daily, '2026-07-31')).toBe(false);
  });

  it('«cada 2 días» solo se propone cada segundo día', () => {
    const everyTwo = {
      ...base,
      isRecurring: true,
      repeatFreq: 'diaria' as const,
      repeatInterval: 2,
    };
    expect(taskAppliesOn(everyTwo, '2026-08-01')).toBe(true);
    expect(taskAppliesOn(everyTwo, '2026-08-02')).toBe(false);
    expect(taskAppliesOn(everyTwo, '2026-08-03')).toBe(true);
  });

  it('una tarea semanal se propone cada 7 días desde su fecha', () => {
    const weekly = { ...base, isRecurring: true, repeatFreq: 'semanal' as const };
    expect(taskAppliesOn(weekly, '2026-08-08')).toBe(true);
    expect(taskAppliesOn(weekly, '2026-08-05')).toBe(false);
  });

  it('«cada 2 semanas» multiplica el intervalo', () => {
    const biweekly = {
      ...base,
      isRecurring: true,
      repeatFreq: 'semanal' as const,
      repeatInterval: 2,
    };
    expect(taskAppliesOn(biweekly, '2026-08-15')).toBe(true);
    expect(taskAppliesOn(biweekly, '2026-08-08')).toBe(false);
  });

  it('una tarea mensual exige el mismo día del mes', () => {
    const monthly = { ...base, isRecurring: true, repeatFreq: 'mensual' as const };
    expect(taskAppliesOn(monthly, '2026-09-01')).toBe(true);
    expect(taskAppliesOn(monthly, '2026-09-02')).toBe(false);
    expect(taskAppliesOn(monthly, '2026-08-15')).toBe(false);
  });

  it('respeta el fin por fecha', () => {
    const withEnd = {
      ...base,
      isRecurring: true,
      repeatFreq: 'diaria' as const,
      repeatEndType: 'fecha' as const,
      repeatEndDate: '2026-08-03',
    };
    expect(taskAppliesOn(withEnd, '2026-08-03')).toBe(true);
    expect(taskAppliesOn(withEnd, '2026-08-04')).toBe(false);
  });

  it('respeta el fin por cantidad de repeticiones', () => {
    const withCount = {
      ...base,
      isRecurring: true,
      repeatFreq: 'diaria' as const,
      repeatEndType: 'cantidad' as const,
      repeatEndCount: 3,
    };
    // día 0, 1 y 2 (tres ocurrencias): 01, 02 y 03 de agosto.
    expect(taskAppliesOn(withCount, '2026-08-01')).toBe(true);
    expect(taskAppliesOn(withCount, '2026-08-03')).toBe(true);
    expect(taskAppliesOn(withCount, '2026-08-04')).toBe(false);
  });
});
