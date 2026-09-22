import { eachDay, monthGrid, startOfMonth, type IsoDate } from '@navis/shared';

import { i18n } from '@/lib/i18n';

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

const esLista = (valor: unknown): valor is readonly string[] =>
  Array.isArray(valor) && valor.every((item) => typeof item === 'string');

/**
 * La cuadrícula de un mes para `CalendarGrid` — Fase 5. La aritmética de
 * calendario sale de `@navis/shared` (Regla 1: ya la usa la API para lo
 * mismo); el idioma va encima con `Intl` para el mes y con la **traducción**
 * para las iniciales de los días: `Intl` con `weekday: 'narrow'` no garantiza
 * los datos de todos los idiomas en Hermes y salían en inglés.
 */
export function buildDateGrid(monthIso: IsoDate): DateGrid {
  const start = startOfMonth(monthIso);
  const { from, to } = monthGrid(start);
  const days = eachDay(from, to);

  const weeks: IsoDate[][] = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  const monthLabel = new Intl.DateTimeFormat(i18n.resolvedLanguage ?? i18n.language, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${start}T00:00:00Z`));

  const etiquetas = i18n.exists('calendar.weekdayInitials')
    ? (i18n.t('calendar.weekdayInitials', { returnObjects: true }) as unknown)
    : null;
  const weekdayLabels = esLista(etiquetas)
    ? [...etiquetas]
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return { monthLabel, weekdayLabels, weeks };
}

/** `true` si el día pertenece al mes de referencia (no es relleno del borde). */
export function isInMonth(day: IsoDate, monthIso: IsoDate): boolean {
  return day.slice(0, 7) === startOfMonth(monthIso).slice(0, 7);
}
