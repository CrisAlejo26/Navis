import { describe, expect, it } from 'vitest';
import { byWeek, byPriority, byTag, streak90, trend } from './task-stats';
import { byWeek as habitByWeek, byTag as habitByTag, trend as habitTrend } from './habit-stats';
import type { TaskOccurrence } from './schemas/tasks';
import type { HabitOccurrence } from './schemas/habits';

const tags = [{ id: 'tag', name: 'Visitas', icon: 'people', accent: 'primary' }];
const items: TaskOccurrence[] = [
    {
        taskId: 'a',
        date: '2026-10-05',
        title: 'Visitar',
        description: null,
        time: null,
        priority: 'alta',
        status: 'completada',
        completedAt: null,
        isRecurring: false,
        tags,
        reminder: null,
        createdAt: '2026-10-05',
    },
    {
        taskId: 'b',
        date: '2026-10-06',
        title: 'Leer',
        description: null,
        time: null,
        priority: 'media',
        status: 'en_progreso',
        completedAt: null,
        isRecurring: false,
        tags,
        reminder: null,
        createdAt: '2026-10-05',
    },
];
describe('estadísticas compartidas', () => {
    it('mantiene semanas vacías y calcula cumplimiento, prioridades y etiquetas', () => {
        const weeks = byWeek(items, '2026-10-05', '2026-10-18');
        expect(weeks).toEqual([
            { week: '2026-10-05', completed: 1, pending: 1 },
            { week: '2026-10-12', completed: 0, pending: 0 },
        ]);
        expect(trend(weeks).map((week) => week.rate)).toEqual([0.5, 0]);
        expect(byPriority(items).map((bucket) => bucket.count)).toEqual([0, 1, 1]);
        expect(byTag(items)).toMatchObject([{ tagId: 'tag', count: 2 }]);
    });
    it('la tira distingue completado, pendiente y vacío', () => {
        expect(streak90(items, '2026-10-05', '2026-10-07')).toEqual([
            { date: '2026-10-05', completed: true, empty: false },
            { date: '2026-10-06', completed: false, empty: false },
            { date: '2026-10-07', completed: false, empty: true },
        ]);
    });
    it('hábitos usa el mismo cumplimiento semanal sin introducir racha o prioridad', () => {
        const habits: HabitOccurrence[] = items.map((item) => ({
            ...item,
            habitId: item.taskId,
            goal: '20 min',
            status: item.status === 'completada' ? 'completada' : 'pendiente',
        }));
        expect(habitByWeek(habits, '2026-10-05', '2026-10-18')).toEqual(
            byWeek(items, '2026-10-05', '2026-10-18'),
        );
        expect(habitByTag(habits)).toEqual(byTag(items));
        expect(
            habitTrend(habitByWeek(habits, '2026-10-05', '2026-10-18')).map((week) => week.rate),
        ).toEqual([0.5, 0]);
    });
});
