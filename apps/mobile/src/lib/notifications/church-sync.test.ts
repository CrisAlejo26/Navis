import { isolationSuite } from '@/data/test-support/church-isolation-suite';
import { ISOLATION_OWNER } from '@/data/test-support/seed-two-churches';
import { getDb } from '@/data/db';
import { createNote } from '@/data/repos/notes-repo';
import { createExpoScheduler } from './expo-scheduler';
import { getPermissionStatus } from './permission';
import { syncNotifications } from './sync';
import { useLocalSession } from '@/stores/local-session';
import { useNotificationSettings } from '@/stores/notification-settings';
import type { PlannedNotice, ScheduledNotice, NotificationScheduler } from './types';
jest.mock('./expo-scheduler', () => ({ createExpoScheduler: jest.fn() }));
jest.mock('./permission', () => ({ getPermissionStatus: jest.fn() }));
const suite = isolationSuite();

// A4/DC11: límite global, orden temporal y persistencia al cambiar de iglesia.
it('reparte los 50 avisos por fecha y no pierde los de la iglesia que se deja', async () => {
    const { north, south } = suite.churches();
    const before = useLocalSession.getState();
    const settings = useNotificationSettings.getState();
    useLocalSession.setState({
        session: { userId: ISOLATION_OWNER, churchId: north.churchId },
        hydrated: true,
    });
    useNotificationSettings.setState({ enabled: true, noteReminders: true });
    const scheduled = new Map<string, PlannedNotice>();
    const scheduler: NotificationScheduler = {
        list: () =>
            Promise.resolve(
                [...scheduled.values()].map((n): ScheduledNotice => ({
                    ...n,
                    fireAt: n.fireAt.getTime(),
                })),
            ),
        schedule: jest.fn((n) => Promise.resolve(void scheduled.set(n.key, n))),
        cancel: jest.fn((id) => Promise.resolve(void scheduled.delete(id))),
    };
    jest.mocked(createExpoScheduler).mockResolvedValue(scheduler);
    jest.mocked(getPermissionStatus).mockResolvedValue('granted');
    try {
        // Fechas suficientemente futuras; se insertan en orden inverso al de aviso.
        for (let day = 60; day > 0; day--) {
            const church = day % 2 ? north : south;
            await createNote(church.believerId, church.churchId, ISOLATION_OWNER, {
                kind: 'seguimiento',
                occurredAt: '2026-09-30',
                told: `Nota ${day}`,
                remindAt: new Date(2099, 0, day, 12).toISOString(),
            });
        }
        await syncNotifications();
        expect(scheduled.size).toBe(50);
        const notices = [...scheduled.values()];
        expect(new Set(notices.map((n) => n.data.churchId))).toEqual(
            new Set([north.churchId, south.churchId]),
        );
        expect(
            notices.every((n) =>
                n.title.includes(n.data.churchId === north.churchId ? 'N-Iglesia' : 'S-Iglesia'),
            ),
        ).toBe(true);
        expect(notices.at(-1)?.fireAt.getTime()).toBe(new Date(2099, 0, 50, 12).getTime());
        useLocalSession.getState().setChurch(south.churchId);
        await syncNotifications();
        expect(scheduler.schedule).toHaveBeenCalledTimes(50);
        expect(scheduler.cancel).not.toHaveBeenCalled();
        // La baja retira lo inaccesible, incluso si no era la iglesia activa.
        await (
            await getDb()
        ).runAsync(
            'UPDATE church_members SET deleted_at = ? WHERE church_id = ?',
            't',
            north.churchId,
        );
        await syncNotifications();
        expect([...scheduled.values()].every((n) => n.data.churchId === south.churchId)).toBe(true);
        expect([...scheduled.values()].every((n) => !n.title.includes('S-Iglesia'))).toBe(true);
        useNotificationSettings.setState({ enabled: false });
        await syncNotifications();
        expect(scheduled.size).toBe(0);
    } finally {
        useLocalSession.setState({ session: before.session, hydrated: before.hydrated });
        useNotificationSettings.setState({
            enabled: settings.enabled,
            noteReminders: settings.noteReminders,
        });
    }
});
