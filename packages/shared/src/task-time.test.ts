import { describe, expect, it } from 'vitest';
import {
    closedSeconds,
    entrySeconds,
    formatClock,
    formatDurationShort,
    summarizeTime,
} from './task-time';

const entry = (id: string, taskId: string, startedAt: string, endedAt: string | null) => ({
    id,
    taskId,
    startedAt,
    endedAt,
});
const A = '00000000-0000-4000-8000-00000000000a';
const B = '00000000-0000-4000-8000-00000000000b';
const FLOW = { id: '00000000-0000-4000-8000-0000000000f1', name: 'Visitas', accent: '#2140cf' };

describe('entrySeconds', () => {
    const now = new Date('2026-10-08T10:00:00.000Z');
    it('una entrada cerrada dura de su inicio a su fin', () => {
        expect(
            entrySeconds(
                { startedAt: '2026-10-08T09:00:00.000Z', endedAt: '2026-10-08T09:30:30.000Z' },
                now,
            ),
        ).toBe(1830);
    });
    it('una abierta cuenta hasta ahora', () => {
        expect(entrySeconds({ startedAt: '2026-10-08T09:59:00.000Z', endedAt: null }, now)).toBe(
            60,
        );
    });
    it('nunca es negativa ni explota con una fecha rota', () => {
        expect(entrySeconds({ startedAt: '2026-10-08T11:00:00.000Z', endedAt: null }, now)).toBe(0);
        expect(entrySeconds({ startedAt: 'mañana', endedAt: null }, now)).toBe(0);
    });
});

describe('closedSeconds', () => {
    it('suma solo las cerradas', () => {
        expect(
            closedSeconds([
                { startedAt: '2026-10-08T09:00:00.000Z', endedAt: '2026-10-08T09:01:00.000Z' },
                { startedAt: '2026-10-08T09:00:00.000Z', endedAt: null },
            ]),
        ).toBe(60);
    });
});

describe('formatClock y formatDurationShort', () => {
    it('el reloj lleva horas solo cuando hacen falta', () => {
        expect(formatClock(0)).toBe('00:00');
        expect(formatClock(723)).toBe('12:03');
        expect(formatClock(3912)).toBe('1:05:12');
        expect(formatClock(-5)).toBe('00:00');
    });
    it('la duración corta quita lo que sobra', () => {
        expect(formatDurationShort(30)).toBe('30s');
        expect(formatDurationShort(45 * 60)).toBe('45m');
        expect(formatDurationShort(2 * 3600 + 15 * 60)).toBe('2h 15m');
        expect(formatDurationShort(2 * 3600)).toBe('2h');
    });
});

describe('summarizeTime', () => {
    const tasks = [
        { id: A, title: 'Sermón', workflow: FLOW },
        { id: B, title: 'Llamadas', workflow: null },
    ];
    const base = { tasks, from: '2026-10-05', to: '2026-10-11', timezone: 'UTC' };

    it('suma por tarea y por flujo, y deja la tarea sin flujo aparte', () => {
        const summary = summarizeTime({
            ...base,
            entries: [
                entry('1', A, '2026-10-06T09:00:00.000Z', '2026-10-06T10:00:00.000Z'),
                entry('2', A, '2026-10-07T09:00:00.000Z', '2026-10-07T09:30:00.000Z'),
                entry('3', B, '2026-10-07T12:00:00.000Z', '2026-10-07T12:10:00.000Z'),
            ],
        });
        expect(summary.totalSeconds).toBe(3600 + 1800 + 600);
        expect(summary.byTask).toEqual([
            { taskId: A, title: 'Sermón', seconds: 5400 },
            { taskId: B, title: 'Llamadas', seconds: 600 },
        ]);
        expect(summary.byWorkflow).toEqual([
            { workflowId: FLOW.id, name: 'Visitas', accent: '#2140cf', seconds: 5400 },
            { workflowId: null, name: null, accent: null, seconds: 600 },
        ]);
    });

    it('el cronómetro en marcha no cuenta hasta cerrarse', () => {
        const summary = summarizeTime({
            ...base,
            entries: [entry('1', A, '2026-10-06T09:00:00.000Z', null)],
        });
        expect(summary.totalSeconds).toBe(0);
        expect(summary.byTask).toEqual([]);
    });

    it('una entrada es del día en que empezó, en la zona de la iglesia', () => {
        // 23:30 en Bogotá (UTC-5) del domingo 11 es lunes 12 en UTC.
        const late = entry('1', A, '2026-10-12T04:30:00.000Z', '2026-10-12T05:00:00.000Z');
        expect(
            summarizeTime({ ...base, timezone: 'America/Bogota', entries: [late] }).totalSeconds,
        ).toBe(1800);
        expect(summarizeTime({ ...base, timezone: 'UTC', entries: [late] }).totalSeconds).toBe(0);
    });

    it('deja fuera lo de otro rango y las tareas desconocidas', () => {
        const summary = summarizeTime({
            ...base,
            entries: [
                entry('1', A, '2026-10-04T09:00:00.000Z', '2026-10-04T10:00:00.000Z'),
                entry('2', A, '2026-10-12T09:00:00.000Z', '2026-10-12T10:00:00.000Z'),
                entry(
                    '3',
                    '00000000-0000-4000-8000-0000000000ff',
                    '2026-10-06T09:00:00.000Z',
                    '2026-10-06T10:00:00.000Z',
                ),
            ],
        });
        expect(summary.totalSeconds).toBe(0);
    });
});
