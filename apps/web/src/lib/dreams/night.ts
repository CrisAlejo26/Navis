import { addDays, todayIn, type IsoDate } from '@navis/shared';

/** Hasta qué hora se entiende que lo que se escribe es de la noche anterior. */
export const DAWN_HOUR = 6;

/**
 * Qué noche se propone al abrir el formulario (RFC 0005 D17).
 *
 * Si son las cuatro de la mañana, el sueño es **de anoche**: quien acaba de
 * despertarse y lo apunta no está contando el de la noche que viene. A partir
 * de las seis se propone hoy, que es cuando ya se escribe «de esta noche».
 *
 * El día sale de `todayIn` con la zona del navegador y no de `toISOString`:
 * eso último da el día **UTC**, que de madrugada es justo el equivocado.
 */
export function proposedNight(now = new Date()): IsoDate {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const today = todayIn(timezone, now);

  return now.getHours() < DAWN_HOUR ? addDays(today, -1) : today;
}
