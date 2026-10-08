import { describe, it, expect } from 'vitest';
import { taskAppliesOn } from './task-recurrence';
import { changeTaskSeries } from './task-series';
import { createTaskSchema } from './schemas/tasks';
const base = {
    date: '2026-10-06',
    isRecurring: true,
    repeatFreq: 'semanal' as const,
    repeatInterval: 2,
    repeatEndType: 'cantidad' as const,
    repeatEndDate: null,
    repeatEndCount: 3,
};
describe('repetición avanzada y vida de una serie', () => {
    it('usa semanas de lunes a domingo, excluye días anteriores al ancla y cuenta cada día seleccionado', () => {
        const task = { ...base, repeatOptions: { kind: 'weekdays' as const, weekdays: [1, 3, 5] } };
        for (const date of ['2026-10-07', '2026-10-09', '2026-10-19'])
            expect(taskAppliesOn(task, date)).toBe(true);
        for (const date of ['2026-10-05', '2026-10-12', '2026-10-21'])
            expect(taskAppliesOn(task, date)).toBe(false);
    });
    it('salta meses sin día 31 sin consumir una ocurrencia', () => {
        const task = {
            ...base,
            date: '2026-01-31',
            repeatFreq: 'mensual' as const,
            repeatInterval: 1,
            repeatEndCount: 2,
            repeatOptions: { kind: 'monthDay' as const, day: 31 },
        };
        expect(taskAppliesOn(task, '2026-03-31')).toBe(true);
        expect(taskAppliesOn(task, '2026-04-30')).toBe(false);
        expect(taskAppliesOn(task, '2026-05-31')).toBe(false);
    });
    it('encuentra el último domingo del mes y el segundo martes', () => {
        const task = {
            ...base,
            repeatFreq: 'mensual' as const,
            repeatInterval: 1,
            repeatEndType: 'nunca' as const,
            repeatOptions: { kind: 'monthWeekday' as const, week: -1, weekday: 0 },
        };
        expect(taskAppliesOn(task, '2026-10-25')).toBe(true);
        expect(taskAppliesOn(task, '2026-10-18')).toBe(false);
        expect(
            taskAppliesOn(
                { ...task, repeatOptions: { ...task.repeatOptions, week: 2, weekday: 2 } },
                '2026-10-13',
            ),
        ).toBe(true);
    });
    it('ordena fechas únicas y respeta cantidad y fin inclusivo', () => {
        const task = {
            ...base,
            repeatFreq: 'fechas' as const,
            repeatEndCount: 1,
            repeatOptions: { kind: 'dates' as const, dates: ['2026-10-09', '2026-10-07'] },
        };
        expect(taskAppliesOn(task, '2026-10-07')).toBe(true);
        expect(taskAppliesOn(task, '2026-10-09')).toBe(false);
        expect(createTaskSchema.safeParse({ ...task, title: 'Visitar' }).success).toBe(false); // null end date is not an input
        expect(
            createTaskSchema.safeParse({
                title: 'Visitar',
                date: base.date,
                isRecurring: true,
                repeatFreq: 'diaria',
                repeatOptions: task.repeatOptions,
            }).success,
        ).toBe(false);
    });
    it('una pausa no cambia el pasado; reanudar y terminar mantienen periodos cerrados', () => {
        const paused = changeTaskSeries({}, { action: 'pause', date: '2026-10-08' });
        const resumed = changeTaskSeries(paused, { action: 'resume', date: '2026-10-10' });
        const task = {
            ...base,
            repeatFreq: 'diaria' as const,
            repeatInterval: 1,
            repeatEndType: 'nunca' as const,
            ...resumed,
        };
        expect(taskAppliesOn(task, '2026-10-07')).toBe(true);
        expect(taskAppliesOn(task, '2026-10-09')).toBe(false);
        expect(taskAppliesOn(task, '2026-10-10')).toBe(true);
        expect(
            taskAppliesOn(
                { ...task, ...changeTaskSeries(resumed, { action: 'finish', date: '2026-10-11' }) },
                '2026-10-11',
            ),
        ).toBe(false);
        expect(() => changeTaskSeries(paused, { action: 'resume', date: '2026-10-07' })).toThrow();
    });
});
