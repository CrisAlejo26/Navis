import type { NotificationScheduler, ScheduledNotice } from '../types';

/** Un sistema de avisos en memoria: lo que el móvil real hace con `expo-notifications`. */
export function memoryScheduler(initial: ScheduledNotice[] = []) {
    const scheduled = new Map(initial.map((notice) => [notice.key, notice]));
    const calls = { schedule: [] as string[], cancel: [] as string[] };
    const scheduler: NotificationScheduler = {
        list: () => Promise.resolve([...scheduled.values()]),
        schedule: (notice) => {
            calls.schedule.push(notice.key);
            scheduled.set(notice.key, {
                data: notice.data,
                key: notice.key,
                fireAt: notice.fireAt.getTime(),
                title: notice.title,
                body: notice.body,
            });
            return Promise.resolve();
        },
        cancel: (key) => {
            calls.cancel.push(key);
            scheduled.delete(key);
            return Promise.resolve();
        },
    };
    return { scheduler, scheduled, calls };
}
