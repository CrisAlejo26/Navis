import type { DreamState } from '@navis/shared';

import type { IoniconName } from '@/lib/nav-mobile';

/**
 * Los papeles de los tres estados de un sueño, traducidos a Ionicons: la luna
 * (apuntado), la brújula (en estudio) y el sol al salir (cumplido) de la web.
 * Comprobados a simple vista: ninguno se lee como cruz (Regla 7 §6).
 */
export const DREAM_STATE_ICONS: Record<DreamState, IoniconName> = {
    apuntado: 'moon-outline',
    estudio: 'compass-outline',
    cumplido: 'sunny-outline',
};

export const DREAM_STATE_TONE = {
    apuntado: 'muted',
    estudio: 'primary',
    cumplido: 'success',
} as const;

export const DREAM_SECTION_ICON: IoniconName = 'moon-outline';
