import type { NoticeData } from '@/lib/notifications/routes';

/** Todo lo que programa Navis empieza así: es lo que separa lo nuestro de lo ajeno. */
export const NOTICE_KEY_PREFIX = 'navis:';

/** Un aviso que la app quiere que suene: lo calcula un proveedor, sin tocar el sistema. */
export interface PlannedNotice {
    /** Estable por entidad: reeditar sustituye el aviso, no lo acumula. */
    key: string;
    fireAt: Date;
    title: string;
    body: string;
    channelId: string;
    data: NoticeData;
}

/** Lo que el sistema tiene ahora programado de nuestros avisos. */
export interface ScheduledNotice {
    data: NoticeData | null;
    key: string;
    /** Milisegundos; `null` si el aviso no trae su fecha. */
    fireAt: number | null;
    title: string;
    body: string;
}

/**
 * La frontera con el sistema operativo (Regla 1: adaptador de plataforma).
 * Solo declara lo que cambia entre el móvil real y el doble de los tests.
 */
export interface NotificationScheduler {
    list: () => Promise<ScheduledNotice[]>;
    schedule: (notice: PlannedNotice) => Promise<void>;
    cancel: (key: string) => Promise<void>;
}
