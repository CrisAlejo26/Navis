import '@/data/test-support';
import { readFileSync, writeFileSync } from 'node:fs';
import { createTaskSchema, createHabitSchema } from '@navis/shared';
import { createTask, setTaskStatus, deleteTask } from './tasks-repo';
import { createHabit, setHabitStatus, deleteHabit } from './habits-repo';
import { createTaskTag } from './tags-repo';
import { taskStatistics, habitStatistics } from './activity-stats';
import { dashboardTasks } from './dashboard-tasks';
import { tasksFixture } from './tasks-test-support';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
interface Fixture {
    today: string;
    from: string;
    to: string;
    tag: { name: string; icon: string; accent: string };
    tasks: {
        title: string;
        date: string;
        priority: string;
        isRecurring: boolean;
        repeatFreq?: string;
        completed: string[];
        inProgress: string[];
        deleted: boolean;
    }[];
    habits: {
        title: string;
        date: string;
        goal: string;
        repeatFreq: string;
        completed: string[];
        deleted: boolean;
    }[];
}
const fixture = JSON.parse(
    readFileSync('../../docs/qa/tareas-movil/paridad-fase4.json', 'utf8'),
) as Fixture;
describe('estadísticas locales y contrato de paridad con API', () => {
    const { contexts: c } = tasksFixture();
    it('expande las mismas series, preserva histórico y separa la racha de los hábitos', async () => {
        const tag = await createTaskTag(c.north, fixture.tag);
        for (const row of fixture.tasks) {
            const id = await createTask(
                c.north,
                createTaskSchema.parse({ ...row, tagIds: [tag], reminderEnabled: false }),
            );
            for (const date of row.completed) await setTaskStatus(c.north, id, date, 'completada');
            for (const date of row.inProgress)
                await setTaskStatus(c.north, id, date, 'en_progreso');
            if (row.deleted) await deleteTask(c.north, id);
        }
        for (const row of fixture.habits) {
            const id = await createHabit(
                c.north,
                createHabitSchema.parse({ ...row, tagIds: [tag], reminderEnabled: false }),
            );
            for (const date of row.completed) await setHabitStatus(c.north, id, date, 'completada');
            if (row.deleted) await deleteHabit(c.north, id);
        }
        const tasks = await taskStatistics(c.north, fixture.today, fixture.from, fixture.to);
        const habits = await habitStatistics(c.north, fixture.from, fixture.to);
        expect(tasks.byWeek).toEqual([
            { week: '2026-09-28', completed: 3, pending: 0 },
            { week: '2026-10-05', completed: 0, pending: 4 },
        ]);
        expect(tasks.currentStreak).toBe(3);
        expect(tasks.longestStreak).toBe(3);
        expect(tasks.byTag[0].count).toBe(7);
        expect(habits.byWeek).toEqual([
            { week: '2026-09-28', completed: 1, pending: 3 },
            { week: '2026-10-05', completed: 2, pending: 2 },
        ]);
        const dashboard = await dashboardTasks(c.north.churchId, c.north.userId, fixture.today);
        expect(dashboard.tasks.map((item) => item.title)).toEqual(['Diaria', 'Semanal']);
        expect(dashboard.streak).toBe(3);
        const normalize = <T extends { byTag: { tagId: string }[] }>(stats: T) => ({
            ...stats,
            byTag: stats.byTag.map((bucket) => ({ ...bucket, tagId: 'tag' })),
        });
        const expected: unknown = JSON.parse(
            readFileSync('../../docs/qa/tareas-movil/paridad-fase4-esperada.json', 'utf8'),
        );
        expect({ tasks: normalize(tasks), habits: normalize(habits) }).toEqual(expected);
        // Optional native/API QA handoff: compare actual repository output, not a copied implementation.
        if (process.env.NAVIS_PARITY_OUTPUT)
            writeFileSync(
                process.env.NAVIS_PARITY_OUTPUT,
                JSON.stringify({ tasks: normalize(tasks), habits: normalize(habits) }),
            );
        expect(
            (await taskStatistics(c.south, fixture.today, fixture.from, fixture.to)).byTag,
        ).toEqual([]);
        expect(
            (await habitStatistics(c.member, fixture.from, fixture.to)).byWeek.every(
                (week) => week.completed + week.pending === 0,
            ),
        ).toBe(true);
    });
});
