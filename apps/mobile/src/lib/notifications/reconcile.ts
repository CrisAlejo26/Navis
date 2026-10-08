import type { NotificationScheduler, PlannedNotice } from '@/lib/notifications/types';
import { noticeDataSchema } from '@/lib/notifications/routes';

/**
 * Android entrega las alarmas «con ventana»: pueden salir hasta un par de
 * minutos después de su hora. Un aviso pasado hace menos que esto sigue
 * pendiente de verdad, así que no se cancela aunque el plan ya no lo incluya.
 */
const DELIVERY_GRACE_MS = 3 * 60_000;

const isAboutToFire = (fireAt: number | null, now: Date): boolean =>
    fireAt !== null && fireAt <= now.getTime() && now.getTime() - fireAt <= DELIVERY_GRACE_MS;

/**
 * Deja el sistema como dice el plan: cancela lo que sobra y programa lo que
 * falta o ha cambiado (fecha, título o cuerpo). Idempotente — se puede llamar
 * en cada arranque, cada cambio de ajuste y cada vez que se guarda algo — y
 * por eso no vuelve a programar lo que ya está bien.
 */
export async function reconcile(
    scheduler: NotificationScheduler,
    planned: PlannedNotice[],
    now = new Date(),
): Promise<void> {
    const current = new Map((await scheduler.list()).map((notice) => [notice.key, notice]));
    const wanted = new Set(planned.map((notice) => notice.key));

    for (const [key, notice] of current) {
        if (!wanted.has(key) && !isAboutToFire(notice.fireAt, now)) await scheduler.cancel(key);
    }

    for (const notice of planned) {
        const existing = current.get(notice.key);
        const parsed = noticeDataSchema.safeParse(existing?.data);
        const upToDate =
            existing?.fireAt === notice.fireAt.getTime() &&
            existing.title === notice.title &&
            existing.body === notice.body &&
            parsed.success &&
            parsed.data.churchId === notice.data.churchId &&
            (parsed.data.type === 'journal-reminder' && notice.data.type === 'journal-reminder'
                ? parsed.data.entryId === notice.data.entryId
                : parsed.data.type === 'note-reminder' &&
                  notice.data.type === 'note-reminder' &&
                  parsed.data.believerId === notice.data.believerId &&
                  parsed.data.noteId === notice.data.noteId);
        if (!upToDate) await scheduler.schedule(notice);
    }
}
