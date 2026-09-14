import { getLocale, i18n } from './i18n';

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

/** «10 sept.» para la pastilla de la fecha en el hero del panel. */
export function formatShortDate(value: Date): string {
  return new Intl.DateTimeFormat(getLocale(), { day: 'numeric', month: 'short' }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(getLocale()).format(value);
}

/**
 * «hace 3 semanas», «hace 2 meses». En web sale de `Intl.RelativeTimeFormat`
 * (Regla 2 §6); aquí no: Hermes en Android no lo trae —tampoco
 * `Intl.PluralRules` ni `Intl.getCanonicalLocales`, de los que depende
 * cualquier polyfill— y `formatAgo` reventaba en cuanto el panel de inicio
 * pintaba a alguien que «pide atención» (justo al sembrar datos de prueba).
 * Se resuelve con las claves de `common.*`, con el mismo `_one`/`_other` que
 * ya entiende i18next en los seis idiomas (Regla 2 §8: los sufijos `_many`
 * son para cuando la categoría cambia la palabra, y aquí no pasa).
 */
export function formatAgo(days: number): string {
  if (days === 0) return i18n.t('common.today');
  if (days < 7) return i18n.t('common.daysAgo', { count: days });
  if (days < 31) return i18n.t('common.weeksAgo', { count: Math.round(days / 7) });
  if (days < 365) return i18n.t('common.monthsAgo', { count: Math.round(days / 30) });
  return i18n.t('common.yearsAgo', { count: Math.round(days / 365) });
}
