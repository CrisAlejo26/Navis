import type { NotificationScheduler, PlannedNotice } from '@/lib/notifications/types';

/**
 * Deja el sistema como dice el plan: cancela lo que sobra y programa lo que
 * falta o ha cambiado (fecha, título o cuerpo). Idempotente — se puede llamar
 * en cada arranque, cada cambio de ajuste y cada vez que se guarda algo — y
 * por eso no vuelve a programar lo que ya está bien.
 */
export async function reconcile(
    scheduler: NotificationScheduler,
    planned: PlannedNotice[],
): Promise<void> {
    const current = new Map((await scheduler.list()).map((notice) => [notice.key, notice]));
    const wanted = new Set(planned.map((notice) => notice.key));

    for (const key of current.keys()) {
        if (!wanted.has(key)) await scheduler.cancel(key);
    }

    for (const notice of planned) {
        const existing = current.get(notice.key);
        const upToDate =
            existing?.fireAt === notice.fireAt.getTime() &&
            existing.title === notice.title &&
            existing.body === notice.body;
        if (!upToDate) await scheduler.schedule(notice);
    }
}
