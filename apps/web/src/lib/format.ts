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

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}
