import type { ProphecyState } from '@navis/shared';

import type { IoniconName } from '@/lib/nav-mobile';

/**
 * Los papeles de profecías, traducidos a Ionicons (docs/profecias-movil-plan.md
 * §3.3): «Anchor» y «Waves» de la web no existen en este juego de iconos, así
 * que «cumplida» pasa a una bandera de llegada y «en camino» a una señal de
 * sendero. Comprobados a simple vista: ninguno se lee como cruz (Regla 7 §6).
 */
export const PROPHECY_STATE_ICONS: Record<ProphecyState, IoniconName> = {
    espera: 'hourglass-outline',
    camino: 'trail-sign-outline',
    cumplida: 'flag-outline',
};

export const PROPHECY_STATE_TONE = {
    espera: 'warning',
    camino: 'primary',
    cumplida: 'success',
} as const;

export const PROPHECY_SECTION_ICON: IoniconName = 'sparkles-outline';
