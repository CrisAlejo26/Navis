/**
 * Un día de calendario tal y como viaja: `AAAA-MM-DD`.
 *
 * Los dos motores devuelven texto en las columnas `date` cuando la lee una
 * entidad, pero **un `MAX(...)` en crudo desde Postgres vuelve como `Date`**, y
 * ahí está la trampa: el driver lo construye a medianoche **local**, así que
 * `toISOString()` en cualquier huso al este de Greenwich devuelve el día
 * anterior. El 1 de agosto en Madrid es `2026-07-31T22:00Z`.
 *
 * Por eso se lee con los getters locales y no por ISO. Es la misma pelea de
 * siempre con las fechas (RFC 0002 D5, RFC 0003 D9), y se corta aquí, una vez.
 */
export function toIsoDay(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10);

  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${String(value.getFullYear())}-${month}-${day}`;
}
