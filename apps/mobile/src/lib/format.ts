import { getLocale } from './i18n';

/**
 * Fechas y números en el idioma activo, con `Intl` (Regla 2). Es el mismo
 * cálculo que `apps/web/src/lib/format.ts`, pero cada app construye el suyo:
 * el único ingrediente que cambia es su propio `getLocale()` (igual que
 * `theme.ts` o `i18n.ts`), y aquí solo hace falta el subconjunto que usa el
 * panel de inicio (RFC 0001).
 */

/** «lunes, 3 de agosto de 2026». Para la cabecera del panel. */
export function formatLongDate(value: Date): string {
  return new Intl.DateTimeFormat(getLocale(), { dateStyle: 'full' }).format(value);
}

/**
 * Un **día de calendario** (`AAAA-MM-DD`), en el idioma activo. Se formatea en
 * UTC porque la fecha ya venía sin hora y no hay ninguna que convertir —la
 * misma trampa que `database/iso-day.ts` en la API (CLAUDE.md).
 */
export function formatDay(iso: string, style: 'short' | 'medium' = 'medium'): string {
  const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(getLocale(), {
    timeZone: 'UTC',
    ...(style === 'short'
      ? { day: '2-digit' as const, month: '2-digit' as const, year: 'numeric' as const }
      : { dateStyle: 'medium' as const }),
  }).format(date);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}

/**
 * «hace 3 semanas», «hace 2 meses». Sale de `Intl.RelativeTimeFormat`: cada
 * idioma tiene sus reglas y ya las sabe (Regla 2 §6).
 */
export function formatAgo(days: number): string {
  const relative = new Intl.RelativeTimeFormat(getLocale(), { numeric: 'auto' });

  if (days < 7) return relative.format(-days, 'day');
  if (days < 31) return relative.format(-Math.round(days / 7), 'week');
  if (days < 365) return relative.format(-Math.round(days / 30), 'month');
  return relative.format(-Math.round(days / 365), 'year');
}
