/**
 * Aritmética de días del calendario, sobre texto `AAAA-MM-DD`.
 *
 * Todo se calcula en UTC —`Date.UTC` y los getters `getUTC*`— y se devuelve
 * como texto. No es un capricho: una programación es un día de calendario, no
 * un instante (RFC 0002 §5.5), y en cuanto se usa la hora local del proceso,
 * un servidor en otro huso empieza a mover las reuniones de día.
 */
export type IsoDate = string;

export function parseIsoDate(iso: IsoDate): Date {
  const [year = 0, month = 1, day = 1] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function toIsoDate(date: Date): IsoDate {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const date = parseIsoDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
}

/** Domingo es 0, como en `Date.getDay()`. */
export function weekdayOf(iso: IsoDate): number {
  return parseIsoDate(iso).getUTCDay();
}

/** Días de diferencia; negativo si `to` es anterior a `from`. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const ms = parseIsoDate(to).getTime() - parseIsoDate(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Los días del tramo, extremos incluidos. */
export function eachDay(from: IsoDate, to: IsoDate): IsoDate[] {
  const total = daysBetween(from, to);
  if (total < 0) return [];

  return Array.from({ length: total + 1 }, (_unused, index) => addDays(from, index));
}

/** El lunes de esa semana. La semana europea empieza en lunes. */
export function startOfWeek(iso: IsoDate, weekStartsOn = 1): IsoDate {
  const shift = (weekdayOf(iso) - weekStartsOn + 7) % 7;
  return addDays(iso, -shift);
}

export function endOfWeek(iso: IsoDate, weekStartsOn = 1): IsoDate {
  return addDays(startOfWeek(iso, weekStartsOn), 6);
}

export function startOfMonth(iso: IsoDate): IsoDate {
  return `${iso.slice(0, 7)}-01`;
}

export function endOfMonth(iso: IsoDate): IsoDate {
  const date = parseIsoDate(startOfMonth(iso));
  date.setUTCMonth(date.getUTCMonth() + 1);
  date.setUTCDate(0);
  return toIsoDate(date);
}

export function addMonths(iso: IsoDate, months: number): IsoDate {
  const date = parseIsoDate(startOfMonth(iso));
  date.setUTCMonth(date.getUTCMonth() + months);
  return toIsoDate(date);
}

/**
 * El tramo que hay que pedir para pintar la rejilla de un mes: desde el lunes
 * de la primera semana hasta el domingo de la última, para que las celdas de
 * los bordes no salgan vacías.
 */
export function monthGrid(iso: IsoDate, weekStartsOn = 1): { from: IsoDate; to: IsoDate } {
  return {
    from: startOfWeek(startOfMonth(iso), weekStartsOn),
    to: endOfWeek(endOfMonth(iso), weekStartsOn),
  };
}

/** El día de hoy en una zona horaria concreta, que es la de la iglesia. */
export function todayIn(timezone: string, now = new Date()): IsoDate {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  } catch {
    // Una zona inválida no puede dejar el calendario sin «hoy».
    return toIsoDate(now);
  }
}
