import type { Ministry } from '@navis/shared';

/**
 * La clave de traducción de cada ministerio.
 *
 * Un mapa y no una clave construida al vuelo (Regla 2 §3): con
 * ``t(`calendar.ministry_${x}`)`` se pierde el tipado y una clave que falte no
 * la ve nadie hasta que sale en pantalla.
 */
export const MINISTRY_LABELS: Record<Ministry, string> = {
  pulpito: 'calendar.ministryPulpit',
  recepcion: 'calendar.ministryReception',
  sonido: 'calendar.ministrySound',
  biblias: 'calendar.ministryBibles',
};
