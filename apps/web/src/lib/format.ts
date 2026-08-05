import { getLocale } from './i18n';

/**
 * Fechas y números en el idioma activo. Salen de `Intl`, que ya sabe el orden
 * de los componentes y los separadores de cada idioma; no se formatean a mano
 * (Regla 2).
 */
export function formatDate(value: Date | string, style: 'short' | 'medium' = 'medium'): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(getLocale(), { dateStyle: style }).format(date);
}

/** «lunes, 3 de agosto de 2026». Para la cabecera del panel. */
export function formatLongDate(value: Date): string {
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'full' }).format(value);
}

/** «12 ago 2026, 19:00». Un recordatorio lleva hora, no solo día (D16). */
export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** «agosto de 2026». Encabeza cada tramo de la bitácora (RFC 0003 §7.5). */
export function formatMonth(iso: string): string {
  const date = new Date(`${iso.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;

  return new Intl.DateTimeFormat(getLocale(), {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * «05/26». El mes en corto para un eje de gráfico, donde no cabe «mayo de 2026»
 * y doce nombres largos se solapan o se giran (RFC 0004 §7.3).
 *
 * Cifras y no el nombre del mes a propósito: así ocupa lo mismo en los seis
 * idiomas, que es justo lo que hace falta en un eje de ancho fijo.
 */
export function formatShortMonth(iso: string): string {
  const [year = '', month = ''] = iso.slice(0, 7).split('-');
  return `${month}/${year.slice(2)}`;
}

/**
 * Un **día de calendario** (`AAAA-MM-DD`), en el idioma activo.
 *
 * No es lo mismo que `formatDate`, y la diferencia se nota: `new Date('2026-03-14')`
 * es medianoche **UTC**, y al pintarla en la hora local de cualquier huso al
 * oeste de Greenwich sale el día anterior. En Bogotá, una profecía recibida el
 * 14 se leía «13 de marzo». Por eso esto formatea en UTC: la fecha ya venía sin
 * hora y no hay ninguna que convertir.
 *
 * Es la pareja en la interfaz de lo que `database/iso-day.ts` hace en la API.
 */
export function formatDay(iso: string, style: 'short' | 'medium' = 'medium'): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(getLocale(), { dateStyle: style, timeZone: 'UTC' }).format(date);
}

/**
 * Un **tramo** de días, `AAAA-MM-DD` los dos: «7–14 de agosto de 2026».
 *
 * Sale de `Intl.DateTimeFormat#formatRange`, que ya sabe no repetir el mes ni
 * el año cuando coinciden y usa el guion que toca en cada idioma. Escribirlo a
 * mano con dos fechas pegadas da «7 ago 2026 - 14 ago 2026», que es el doble de
 * largo y se lee peor.
 *
 * Con un solo extremo no hay tramo que formatear: eso lo dice quien llama, con
 * su «desde» o su «hasta» delante de `formatDay`.
 */
export function formatDayRange(from: string, to: string): string {
  const start = new Date(`${from.slice(0, 10)}T00:00:00Z`);
  const end = new Date(`${to.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—';

  return new Intl.DateTimeFormat(getLocale(), {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).formatRange(start, end);
}

/**
 * «dom», «lun»… con 0 = domingo, como `weekdayOf` y como `Date.getDay()`.
 *
 * Sale de una semana cualquiera —la del 2 de agosto de 2026, que empieza en
 * domingo— porque lo único que se necesita es el nombre del día en el idioma
 * activo, y `Intl` no lo da suelto.
 */
export function formatWeekday(weekday: number, style: 'short' | 'long' = 'short'): string {
  const date = new Date(Date.UTC(2026, 7, 2 + weekday));

  return new Intl.DateTimeFormat(getLocale(), { weekday: style, timeZone: 'UTC' }).format(date);
}

/**
 * «hace 3 semanas», «hace 2 meses». Sale de `Intl.RelativeTimeFormat` y no de
 * una cadena montada a mano: cada idioma tiene sus reglas y ya las sabe (Regla
 * 2 §6).
 */
export function formatAgo(days: number): string {
  const relative = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });

  if (days < 7) return relative.format(-days, 'day');
  if (days < 31) return relative.format(-Math.round(days / 7), 'week');
  if (days < 365) return relative.format(-Math.round(days / 30), 'month');
  return relative.format(-Math.round(days / 365), 'year');
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}
