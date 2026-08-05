import { daysBetween, type IsoDate, type ProphecyListItem } from '@navis/shared';

/** El tramo de tiempo que ocupa el eje: de la más antigua hasta hoy. */
export interface TravesiaRange {
  from: IsoDate;
  to: IsoDate;
  /** Los años que se rotulan en el eje, de menor a mayor. */
  years: number[];
}

/** Al menos un mes de ancho: con un solo día, todo caería en el mismo punto. */
const MIN_SPAN_DAYS = 30;

/**
 * El tramo del eje de la travesía (RFC 0004 §7.5).
 *
 * Va de la profecía más antigua hasta hoy, no desde el año cero: el eje tiene
 * que enseñar **la espera de estas**, y un tramo fijo dejaría todos los
 * trayectos apelotonados en el borde derecho.
 */
export function travesiaRange(items: readonly ProphecyListItem[], today: IsoDate): TravesiaRange {
  const days = items.map((one) => one.receivedAt).sort();
  const from = days[0] ?? today;
  const primero = Number(from.slice(0, 4));
  const ultimo = Number(today.slice(0, 4));

  return {
    from,
    to: today,
    years: Array.from({ length: ultimo - primero + 1 }, (_, index) => primero + index),
  };
}

/**
 * Dónde cae un día dentro del eje, de 0 a 1.
 *
 * Se recorta a los extremos: una fecha en el futuro —que se acepta (D7)— no
 * puede pintarse fuera de la pista.
 */
export function positionOf(day: IsoDate, range: TravesiaRange): number {
  const span = Math.max(MIN_SPAN_DAYS, daysBetween(range.from, range.to));
  const offset = daysBetween(range.from, day);
  return Math.min(1, Math.max(0, offset / span));
}

/** Como porcentaje, listo para un `style`. */
export function percentOf(day: IsoDate, range: TravesiaRange): string {
  return `${String(Math.round(positionOf(day, range) * 1000) / 10)}%`;
}

/**
 * El trayecto de una profecía: dónde empieza, dónde acaba y si sigue abierta.
 *
 * El ancho nunca es cero: un trayecto de un solo día tiene que verse, o una
 * profecía recibida y cumplida el mismo día desaparecería de la vista.
 */
export function trackOf(item: ProphecyListItem, range: TravesiaRange) {
  const start = positionOf(item.receivedAt, range);
  const end = positionOf(item.fulfilledAt ?? range.to, range);

  return {
    left: `${String(Math.round(start * 1000) / 10)}%`,
    width: `${String(Math.max(0.8, Math.round((end - start) * 1000) / 10))}%`,
    open: item.fulfilledAt === null,
  };
}
