import '@/data/test-support';
import {
    createJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
} from '@/data/repos/journal-repo';
import { tasksFixture } from '@/data/repos/tasks-test-support';
import { useLocalSession } from '@/stores/local-session';
import { useNotificationSettings } from '@/stores/notification-settings';
import { syncNotifications } from './sync';
import { memoryScheduler } from './test-support/memory-scheduler';
jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));
const mockScheduler = memoryScheduler();
jest.mock('./expo-scheduler', () => ({
    createExpoScheduler: () => Promise.resolve(mockScheduler.scheduler),
}));
jest.mock('./permission', () => ({ getPermissionStatus: () => Promise.resolve('granted') }));
describe('avisos reales del planificador del cuaderno', () => {
    const { contexts: c } = tasksFixture();
    const before = useLocalSession.getState(),
        settings = useNotificationSettings.getState();
    beforeEach(() => {
        mockScheduler.scheduled.clear();
        useLocalSession.setState({
            session: { userId: 'owner', churchId: c.north.churchId },
            hydrated: true,
        });
        useNotificationSettings.setState({ enabled: true, noteReminders: true });
    });
    afterAll(() => {
        useLocalSession.setState(before);
        useNotificationSettings.setState(settings);
    });
    it('atiende y cancela, reabre y programa, cambia fecha y reprograma, borra y cancela', async () => {
        const id = await createJournalEntry(c.north, {
            title: 'Visita',
            kind: 'observacion',
            occurredAt: '2026-10-08',
            annotation: 'Volver a hablar',
            remindAt: '2099-01-10T17:30:00Z',
        });
        await syncNotifications();
        expect(mockScheduler.scheduled.size).toBe(1);
        expect([...mockScheduler.scheduled.values()][0].fireAt).toBe(
            new Date('2099-01-10T17:30:00Z').getTime(),
        );
        await updateJournalEntry(c.north, id, { remindDone: true });
        await syncNotifications();
        expect(mockScheduler.scheduled.size).toBe(0);
        await updateJournalEntry(c.north, id, { remindDone: false });
        await syncNotifications();
        expect(mockScheduler.scheduled.size).toBe(1);
        await updateJournalEntry(c.north, id, { remindDone: true });
        await updateJournalEntry(c.north, id, { remindAt: '2099-01-11T17:30:00Z' });
        await syncNotifications();
        expect([...mockScheduler.scheduled.values()][0].fireAt).toBe(
            new Date('2099-01-11T17:30:00Z').getTime(),
        );
        await deleteJournalEntry(c.north, id);
        await syncNotifications();
        expect(mockScheduler.scheduled.size).toBe(0);
    });
});
