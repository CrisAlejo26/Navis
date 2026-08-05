import {
  addDays,
  addMonths,
  eachDay,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  weekdayOf,
  type DreamEmotionCount,
  type DreamMonth,
  type DreamNight,
  type DreamWeek,
  type DreamWeekdayCount,
  type DreamsStats,
  type IsoDate,
} from '@navis/shared';

/** Lo justo para las cuentas: ni el cuerpo ni el texto de búsqueda (§6.2). */
export interface DreamStatsRow {
  id: string;
  title: string | null;
  dreamedAt: IsoDate;
  fulfilledAt: IsoDate | null;
}

/** Doce columnas de siete noches: lo que enseña la franja (D19). */
export const STRIP_WEEKS = 12;

/** Los doce meses de la línea de la tarjeta del mes. */
const MONTHS = 12;

/**
 * Las cuentas de la portada, sobre las filas ya traídas.
 *
 * Función pura y con «hoy» por parámetro para poder probarla sin base de datos
 * y sin depender del día en que se ejecute la suite.
 */
export function summarize(
  rows: readonly DreamStatsRow[],
  today: IsoDate,
  byEmotion: readonly DreamEmotionCount[],
): DreamsStats {
  const perDay = countByDay(rows);
  const nights = stripNights(perDay, today);
  const weekStart = startOfWeek(today);

  return {
    total: rows.length,
    thisMonth: rows.filter((row) => row.dreamedAt.startsWith(today.slice(0, 7))).length,
    thisWeek: rows.filter((row) => row.dreamedAt >= weekStart && row.dreamedAt <= endOfWeek(today))
      .length,
    fulfilled: rows.filter((row) => row.fulfilledAt !== null).length,
    nights,
    weeks: groupIntoWeeks(nights),
    monthly: monthlyCounts(rows, today),
    byWeekday: weekdayCounts(rows),
    byEmotion: [...byEmotion].sort((a, b) => b.count - a.count),
    streak: streakFrom(perDay, today),
    lastFulfilled: lastFulfilled(rows),
  };
}

function countByDay(rows: readonly DreamStatsRow[]): Map<string, number> {
  const perDay = new Map<string, number>();
  for (const row of rows) {
    perDay.set(row.dreamedAt, (perDay.get(row.dreamedAt) ?? 0) + 1);
  }
  return perDay;
}

/**
 * Las 84 noches de la franja, terminando en el domingo de esta semana.
 *
 * Se llega hasta el final de la semana en curso —con las noches que aún no han
 * pasado a cero— para que la rejilla salga rectangular: una última columna a
 * medias se lee como un fallo de pintado.
 */
function stripNights(perDay: Map<string, number>, today: IsoDate): DreamNight[] {
  const from = addDays(startOfWeek(today), -7 * (STRIP_WEEKS - 1));

  return eachDay(from, endOfWeek(today)).map((day) => ({ day, count: perDay.get(day) ?? 0 }));
}

function groupIntoWeeks(nights: readonly DreamNight[]): DreamWeek[] {
  const weeks = new Map<string, number>();
  for (const night of nights) {
    const week = startOfWeek(night.day);
    weeks.set(week, (weeks.get(week) ?? 0) + night.count);
  }

  return [...weeks].map(([weekStart, count]) => ({ weekStart, count }));
}

function monthlyCounts(rows: readonly DreamStatsRow[], today: IsoDate): DreamMonth[] {
  return Array.from({ length: MONTHS }, (_unused, index) => {
    const month = addMonths(startOfMonth(today), index - (MONTHS - 1)).slice(0, 7);
    return { month, count: rows.filter((row) => row.dreamedAt.startsWith(month)).length };
  });
}

function weekdayCounts(rows: readonly DreamStatsRow[]): DreamWeekdayCount[] {
  return Array.from({ length: 7 }, (_unused, weekday) => ({
    weekday,
    count: rows.filter((row) => weekdayOf(row.dreamedAt) === weekday).length,
  }));
}

/**
 * Noches seguidas con algo apuntado, hacia atrás.
 *
 * Si hoy todavía no hay nada se empieza a contar en ayer: si no, la racha se
 * caería a cero cada mañana y volvería a subir por la noche, que no es lo que
 * significa una racha.
 */
function streakFrom(perDay: Map<string, number>, today: IsoDate): number {
  let day = perDay.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (perDay.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }

  return streak;
}

function lastFulfilled(rows: readonly DreamStatsRow[]): DreamsStats['lastFulfilled'] {
  const fulfilled = rows.filter((row) => row.fulfilledAt !== null);
  if (fulfilled.length === 0) return null;

  const last = fulfilled.reduce((best, row) =>
    (row.fulfilledAt ?? '') > (best.fulfilledAt ?? '') ? row : best,
  );

  return { id: last.id, title: last.title, fulfilledAt: last.fulfilledAt ?? '' };
}
