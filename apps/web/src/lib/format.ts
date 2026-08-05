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
