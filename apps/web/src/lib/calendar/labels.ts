import { parseIsoDate, startOfWeek } from '@navis/shared';

import { getLocale } from '@/lib/i18n';

/**
 * Los nombres de meses y días salen de `Intl` con el idioma activo y **no de
 * las traducciones** (Regla 2 §6): ya están bien localizados, y escribirlos a
 * mano en seis idiomas sería inventar trabajo y errores.
 *
 * Todo se formatea en UTC porque las fechas del calendario son texto
 * `AAAA-MM-DD`: sin `timeZone: 'UTC'`, un navegador al oeste de Greenwich
 * pintaría el día anterior.
 */
function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(getLocale(), { timeZone: 'UTC', ...options }).format(
    parseIsoDate(iso),
  );
}

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase(getLocale()) + text.slice(1);

/** «Agosto de 2026». Es el título de la pantalla. */
export function monthTitle(iso: string): string {
  return capitalize(format(iso, { month: 'long', year: 'numeric' }));
}

/** «Viernes, 15 de agosto». La cabecera del panel del día. */
export function longDay(iso: string): string {
  return capitalize(format(iso, { weekday: 'long', day: 'numeric', month: 'long' }));
}

/** «vie 15». Lo que cabe en una ficha de la agenda. */
export function shortDay(iso: string): string {
  return format(iso, { weekday: 'short', day: 'numeric' });
}

export function dayNumber(iso: string): string {
  return format(iso, { day: 'numeric' });
}

/** «Del 10 al 23 de agosto», o con el mes en los dos extremos si cambia. */
export function rangeTitle(from: string, to: string): string {
  const sameMonth = from.slice(0, 7) === to.slice(0, 7);
  const inicio = sameMonth
    ? format(from, { day: 'numeric' })
    : format(from, { day: 'numeric', month: 'short' });

  return `${inicio} – ${format(to, { day: 'numeric', month: 'long' })}`;
}

/** Las cabeceras de la rejilla, empezando en lunes: «lun», «mar»… */
export function weekdayHeadings(reference = '2026-08-15'): { key: string; label: string }[] {
  const monday = startOfWeek(reference);

  return Array.from({ length: 7 }, (_unused, index) => {
    const day = new Date(parseIsoDate(monday).getTime() + index * 86_400_000)
      .toISOString()
      .slice(0, 10);
    return { key: day, label: capitalize(format(day, { weekday: 'short' })).replace('.', '') };
  });
}
