import '@/data/test-support';
import { createHabit } from '@/data/repos/habits-repo';
import { createTask, deleteTask, updateTask } from '@/data/repos/tasks-repo';
import { habitInput, taskInput, tasksFixture } from '@/data/repos/tasks-test-support';
import { useLocalSession } from '@/stores/local-session';
import { useNotificationSettings } from '@/stores/notification-settings';
import { activityReminderKey } from './plan-activity-reminders';
import { prepareNotice } from './prepare-notice';
import { syncNotifications } from './sync';
import { memoryScheduler } from './test-support/memory-scheduler';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
const mockScheduler = memoryScheduler();
jest.mock('./expo-scheduler', () => ({
    createExpoScheduler: () => Promise.resolve(mockScheduler.scheduler),
}));
jest.mock('./permission', () => ({ getPermissionStatus: () => Promise.resolve('granted') }));

const AT = '2099-01-10T17:30:00.000Z';
const withReminder = { reminderEnabled: true, reminderAt: AT };

describe('sincronizar avisos de tareas y hábitos de punta a punta', () => {
    const { contexts: c } = tasksFixture();
    const before = useLocalSession.getState();
    const settings = useNotificationSettings.getState();

    beforeEach(() => {
        mockScheduler.scheduled.clear();
        useLocalSession.setState({
            session: { userId: 'owner', churchId: c.north.churchId },
            hydrated: true,
        });
        useNotificationSettings.setState({
            enabled: true,
            noteReminders: true,
            taskReminders: true,
        });
    });
    afterAll(() => {
        useLocalSession.setState({ session: before.session, hydrated: before.hydrated });
        useNotificationSettings.setState(settings);
    });

    const keys = () => [...mockScheduler.scheduled.keys()].sort();

    it('programa el recordatorio al guardarlo y lo mueve, y lo cancela al borrar', async () => {
        const task = await createTask(c.north, { ...taskInput, ...withReminder });
        const habit = await createHabit(c.north, { ...habitInput, ...withReminder });
        await syncNotifications();
        expect(keys()).toEqual(
            [activityReminderKey('task', task), activityReminderKey('habit', habit)].sort(),
        );
        const scheduled = mockScheduler.scheduled.get(activityReminderKey('task', task));
        // El usuario tiene dos iglesias: el aviso dice de cuál es.
        expect(scheduled?.title).toBe(`${taskInput.title} — Norte`);
        expect(scheduled?.fireAt).toBe(new Date(AT).getTime());

        await updateTask(c.north, task, { reminderAt: '2099-02-01T08:00:00.000Z' });
        await syncNotifications();
        expect(mockScheduler.scheduled.get(activityReminderKey('task', task))?.fireAt).toBe(
            new Date('2099-02-01T08:00:00.000Z').getTime(),
        );

        await deleteTask(c.north, task);
        await syncNotifications();
        expect(keys()).toEqual([activityReminderKey('habit', habit)]);
    });

    it('apagar el interruptor de tareas cancela solo lo de tareas', async () => {
        await createTask(c.north, { ...taskInput, ...withReminder });
        await syncNotifications();
        expect(keys()).toHaveLength(1);
        useNotificationSettings.setState({ taskReminders: false });
        await syncNotifications();
        expect(keys()).toEqual([]);
    });

    it('con el interruptor general apagado no queda ningún aviso', async () => {
        await createTask(c.north, { ...taskInput, ...withReminder });
        useNotificationSettings.setState({ enabled: false });
        await syncNotifications();
        expect(keys()).toEqual([]);
    });

    it('al tocar el aviso valida que la actividad siga existiendo y sea del usuario', async () => {
        const task = await createTask(c.north, { ...taskInput, ...withReminder });
        const data = {
            type: 'activity-reminder',
            churchId: c.north.churchId,
            kind: 'task',
            activityId: task,
        };
        const change = jest.fn();
        expect(await prepareNotice(data, change)).toMatchObject({ switched: false, data });
        expect(await prepareNotice({ ...data, kind: 'habit' }, change)).toBeNull();
        expect(await prepareNotice({ ...data, activityId: 'otra' }, change)).toBeNull();
        await deleteTask(c.north, task);
        expect(await prepareNotice(data, change)).toBeNull();
        expect(change).not.toHaveBeenCalled();
    });

    it('al tocar un aviso de otra iglesia cambia a ella antes de abrirlo', async () => {
        const task = await createTask(c.south, { ...taskInput, ...withReminder });
        const change = jest.fn((churchId: string) => {
            useLocalSession.getState().setChurch(churchId);
            return Promise.resolve();
        });
        const data = {
            type: 'activity-reminder',
            churchId: c.south.churchId,
            kind: 'task',
            activityId: task,
        };
        expect(await prepareNotice(data, change)).toMatchObject({ switched: true });
        expect(change).toHaveBeenCalledWith(c.south.churchId);
    });
});
