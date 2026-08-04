import { asDay, daysSince } from '../database/date-sql';

/**
 * El aviso de inactividad, escrito en SQL (RFC 0003 §5.4).
 *
 * Se calcula en el servidor —para el filtro «piden atención» y para el
 * resumen— y también en el cliente, para pintar la sonda. Las dos versiones
 * tienen que decir lo mismo: la regla vive en `daysWithoutNote` de
 * `@navis/shared`, y esto es su traducción literal a una consulta.
 *
 * El alias de la tabla es siempre `believer`: es el que usan los dos servicios
 * que la consultan.
 */

/** El día desde el que se cuenta: la última nota o, si no hay ninguna, el alta. */
export const SINCE_LAST_NOTE = `COALESCE(${asDay('believer.last_note_at')}, ${asDay('believer.created_at')})`;

/** «Ha agotado su margen». `:today` lo pone quien monta la consulta. */
export const NEEDS_ATTENTION = `believer.alert_after_days IS NOT NULL AND ${daysSince(SINCE_LAST_NOTE, ':today')} > believer.alert_after_days`;
