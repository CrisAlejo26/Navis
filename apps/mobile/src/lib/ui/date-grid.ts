import { eachDay, monthGrid, startOfMonth, type IsoDate } from '@navis/shared';

import { getLocale } from '@/lib/i18n';

/** Un tramo cerrado de fechas, extremos incluidos — `DatePicker`/`Select` de
 * rango (Fase 5). Vive aquí y no en el componente para que las dos piezas que
 * lo usan (`DateRangePicker` y `DateRangePresets`) lo importen del mismo
 * sitio, sin depender una de la otra. */
export interface DateRange {
  from: IsoDate;
  to: IsoDate;
}

export interface DateGrid {
  /** «septiembre de 2026», en el idioma activo. */
  monthLabel: string;
  /** Iniciales de lunes a domingo, en el idioma activo. */
  weekdayLabels: string[];
  /** Semanas completas (7 días), pueden traer días de fuera del mes. */
  weeks: IsoDate[][];
}

/**
 * La cuadrícula de un mes para `CalendarGrid` — Fase 5. La aritmética de
 * calendario sale de `@navis/shared` (Regla 1: ya la usa la API para lo
 * mismo); aquí solo se le pone el idioma encima con `Intl`.
 */
export function buildDateGrid(monthIso: IsoDate): DateGrid {
  const start = startOfMonth(monthIso);
  const { from, to } = monthGrid(start);
  const days = eachDay(from, to);

  const weeks: IsoDate[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  const locale = getLocale();
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${start}T00:00:00Z`));

  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: 'narrow',
    timeZone: 'UTC',
  });
  // Un lunes cualquiera (2024-01-01) como referencia para los siete nombres.
  const weekdayLabels = weeks[0]?.map((_day, index) =>
    weekdayFormatter.format(new Date(Date.UTC(2024, 0, 1 + index))),
  ) ?? ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return { monthLabel, weekdayLabels, weeks };
}

/** `true` si el día pertenece al mes de referencia (no es relleno del borde). */
export function isInMonth(day: IsoDate, monthIso: IsoDate): boolean {
  return day.slice(0, 7) === startOfMonth(monthIso).slice(0, 7);
}
