import { addDays, addMonths, endOfWeek, monthGrid, startOfWeek } from '@navis/shared';

/**
 * Las cuatro maneras de mirar lo mismo. El **mes** es la predeterminada, y lo
 * es a propósito: la pregunta de todos los días es «¿quién va este día?», y esa
 * se responde mirando una rejilla, no una lista de filtros.
 */
export const CALENDAR_VIEWS = ['month', 'week', 'agenda', 'people'] as const;

export type CalendarView = (typeof CALENDAR_VIEWS)[number];

export const DEFAULT_VIEW: CalendarView = 'month';

export function isCalendarView(value: string): value is CalendarView {
  return (CALENDAR_VIEWS as readonly string[]).includes(value);
}

/** Cuántos días abarca la agenda de una vez: cuatro semanas. */
const AGENDA_DAYS = 28;

export interface DateRange {
  from: string;
  to: string;
}

/**
 * El tramo que pide cada vista alrededor de su fecha ancla.
 *
 * El mes se pide **encuadrado en semanas completas** para que las celdas de
 * los bordes no salgan vacías, y personas comparte tramo con el mes: es la
 * misma información girada.
 */
export function rangeFor(view: CalendarView, anchor: string): DateRange {
  if (view === 'week') return { from: startOfWeek(anchor), to: endOfWeek(anchor) };
  if (view === 'agenda') return { from: anchor, to: addDays(anchor, AGENDA_DAYS - 1) };
  return monthGrid(anchor);
}

/** Anterior y siguiente mueven **un paso del tamaño de la vista**. */
export function stepAnchor(view: CalendarView, anchor: string, delta: number): string {
  if (view === 'week') return addDays(anchor, 7 * delta);
  if (view === 'agenda') return addDays(anchor, AGENDA_DAYS * delta);
  return addMonths(anchor, delta);
}

/** Un rango elegido a mano siempre manda sobre el de la vista. */
export function effectiveRange(
  view: CalendarView,
  anchor: string,
  custom: DateRange | null,
): DateRange {
  return custom ?? rangeFor(view, anchor);
}
