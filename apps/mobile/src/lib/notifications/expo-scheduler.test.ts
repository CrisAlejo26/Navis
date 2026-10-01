import { createExpoScheduler } from './expo-scheduler';
import { reconcile } from './reconcile';
import type { PlannedNotice } from './types';
const mockSchedule = jest.fn();
const mockList = jest.fn();
const mockCancel = jest.fn();
jest.mock('./module', () => ({
    loadNotifications: () =>
        Promise.resolve({
            getAllScheduledNotificationsAsync: mockList,
            scheduleNotificationAsync: mockSchedule,
            cancelScheduledNotificationAsync: mockCancel,
            SchedulableTriggerInputTypes: { DATE: 'date' },
        }),
}));

it('actualiza el data antiguo y transmite iglesia, nota y fecha al adaptador nativo', async () => {
    const notice: PlannedNotice = {
        key: 'navis:note-reminder:nota',
        fireAt: new Date('2099-01-01T12:00:00'),
        title: 'Luis',
        body: 'Llamar',
        channelId: 'notes',
        data: { type: 'note-reminder', churchId: 'sur', believerId: 'luis', noteId: 'nota' },
    };
    mockList.mockResolvedValue([
        {
            identifier: notice.key,
            content: {
                title: 'Luis',
                body: 'Llamar',
                data: {
                    type: 'note-reminder',
                    noteId: 'nota',
                    believerId: 'luis',
                    fireAt: notice.fireAt.getTime(),
                },
            },
        },
        { identifier: 'de-otra-app', content: {} },
    ]);
    const scheduler = await createExpoScheduler();
    expect(scheduler).not.toBeNull();
    if (!scheduler) throw new Error('scheduler absent');
    expect(await scheduler.list()).toEqual([
        {
            key: notice.key,
            title: 'Luis',
            body: 'Llamar',
            fireAt: notice.fireAt.getTime(),
            data: null,
        },
    ]);
    await reconcile(scheduler, [notice]);
    expect(mockSchedule).toHaveBeenCalledWith({
        identifier: notice.key,
        content: {
            title: 'Luis',
            body: 'Llamar',
            sound: true,
            data: { ...notice.data, fireAt: notice.fireAt.getTime() },
        },
        trigger: { type: 'date', date: notice.fireAt, channelId: 'notes' },
    });
    mockList.mockResolvedValue([
        {
            identifier: notice.key,
            content: {
                title: 'Luis',
                body: 'Llamar',
                data: { ...notice.data, fireAt: notice.fireAt.getTime() },
            },
        },
    ]);
    await reconcile(scheduler, [notice]);
    expect(mockSchedule).toHaveBeenCalledTimes(1);
    await reconcile(scheduler, []);
    expect(mockCancel).toHaveBeenCalledWith(notice.key);
});
