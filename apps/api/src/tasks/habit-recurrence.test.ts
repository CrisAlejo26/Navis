import { describe, expect, it } from 'vitest';

import { habitAppliesOn } from './habit-recurrence';

describe('habitAppliesOn', () => {
  it('«ninguna» solo se propone su propio día', () => {
    const habit = { date: '2026-08-01', repeatFreq: 'ninguna' as const };
    expect(habitAppliesOn(habit, '2026-08-01')).toBe(true);
    expect(habitAppliesOn(habit, '2026-08-02')).toBe(false);
  });

  it('diaria se propone todos los días desde su fecha', () => {
    const habit = { date: '2026-08-01', repeatFreq: 'diaria' as const };
    expect(habitAppliesOn(habit, '2026-08-01')).toBe(true);
    expect(habitAppliesOn(habit, '2026-08-20')).toBe(true);
    expect(habitAppliesOn(habit, '2026-07-31')).toBe(false);
  });

  it('semanal se propone cada 7 días', () => {
    const habit = { date: '2026-08-01', repeatFreq: 'semanal' as const };
    expect(habitAppliesOn(habit, '2026-08-08')).toBe(true);
    expect(habitAppliesOn(habit, '2026-08-05')).toBe(false);
  });

  it('mensual exige el mismo día del mes', () => {
    const habit = { date: '2026-08-15', repeatFreq: 'mensual' as const };
    expect(habitAppliesOn(habit, '2026-09-15')).toBe(true);
    expect(habitAppliesOn(habit, '2026-09-16')).toBe(false);
  });
});
