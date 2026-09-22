import { parseIsoDate, startOfWeek } from '@navis/shared';

import { getLocale, i18n } from '@/lib/i18n';

/**
 * Los nombres de meses y días para la lámina, salidos de `Intl` con el idioma
 * activo —la pareja de `apps/web/src/lib/calendar/labels.ts`—. Nada de
 * traducciones a mano: ya están bien localizados (Regla 2 §6).
 *
 * Todo se formatea en UTC porque las fechas del calendario son texto
 * `AAAA-MM-DD`; sin `timeZone: 'UTC'`, un dispositivo al oeste de Greenwich
 * pintaría el día anterior (misma trampa que `formatDay`).
 */
function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getLocale(), { timeZone: 'UTC', ...options }).format(
    parseIsoDate(iso),
  );
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase(getLocale()) + text.slice(1);

/** «Viernes, 15 de agosto». La cabecera de un día suelto. */
export function longDay(iso: string): string {
  return capitalize(format(iso, { weekday: 'long', day: 'numeric', month: 'long' }));
}

/** «Lunes», «Martes»… el nombre del día, para las cabeceras de la tabla. */
export function weekdayName(iso: string): string {
  return capitalize(format(iso, { weekday: 'long' }));
}

export function dayNumber(iso: string): string {
  return format(iso, { day: 'numeric' });
}

/** «Del 10 al 23 de agosto» web: «10 – 23 de agosto», con el mes si cambia. */
export function rangeTitle(from: string, to: string): string {
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const inicio = sameMonth
    ? format(from, { day: 'numeric' })
    : format(from, { day: 'numeric', month: 'short' });

  return `${inicio} – ${format(to, { day: 'numeric', month: 'long' })}`;
}

const esLista = (valor: unknown): valor is readonly string[] =>
  Array.isArray(valor) && valor.every((item) => typeof item === 'string');

/**
 * Las cabeceras de la rejilla, empezando en lunes: «Lun», «Mar»… Salen de la
 * **traducción** y no de `Intl`: en Hermes no hay datos garantizados para
 * `weekday: 'short'` de todos los idiomas (misma razón que `date-grid.ts`).
 */
export function weekdayHeadings(reference = '2026-08-15'): { key: string; label: string }[] {
  const monday = startOfWeek(reference);
  const etiquetas = i18n.exists('calendar.weekdayInitials')
    ? (i18n.t('calendar.weekdayInitials', { returnObjects: true }) as unknown)
    : null;
  const iniciales = esLista(etiquetas)
    ? [...etiquetas]
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return Array.from({ length: 7 }, (_unused, index) => {
    const day = new Date(parseIsoDate(monday).getTime() + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { key: day, label: iniciales[index] ?? '' };
  });
}
