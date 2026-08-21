import {
  addMonths,
  extractTeachingBodyText,
  type TeachingMonth,
  type TeachingsStats,
} from '@navis/shared';

import { parseTeachingBody } from './teachings.mapper';

/** Lo mínimo que hace falta de cada fila para las cuentas. Sin excerpt ni búsqueda. */
export interface StatsRow {
  receivedAt: string;
  bodyJson: string;
}

/** Cuántos meses cubre el gráfico de la portada. */
const MONTHS = 12;

/**
 * Las cuentas de la portada, calculadas sobre las filas de esa persona
 * (RFC 0022 §4.4).
 *
 * En memoria y no con agregados en SQL, por el mismo motivo que las de
 * profecías (RFC 0004 §6.2): es una colección personal, no de una iglesia, y
 * `checklistRate` recorre el JSON de cada fila, cosa que SQL no sabe hacer
 * igual en los dos motores.
 */
export function summarizeTeachings(rows: readonly StatsRow[], today: string): TeachingsStats {
  const year = today.slice(0, 4);
  let thisYear = 0;
  let checked = 0;
  let total = 0;

  for (const row of rows) {
    if (row.receivedAt.startsWith(year)) thisYear += 1;

    const { checklist } = extractTeachingBodyText(parseTeachingBody(row.bodyJson));
    if (checklist) {
      checked += checklist.checked;
      total += checklist.total;
    }
  }

  return {
    total: rows.length,
    thisYear,
    monthly: monthlyGrid(rows, today),
    // `null` y no `0`: cero por ciento y «todavía no hay ninguna checklist»
    // son cosas distintas, y la portada las pinta distinto.
    checklistRate: total === 0 ? null : checked / total,
    checklistChecked: checked,
    checklistTotal: total,
  };
}

/**
 * Los últimos doce meses, **con los vacíos incluidos y a cero** — un gráfico
 * al que le faltan meses sin datos junta dos meses separados por un año y los
 * pinta como si fueran seguidos.
 */
export function monthlyGrid(rows: readonly StatsRow[], today: string): TeachingMonth[] {
  const months = Array.from({ length: MONTHS }, (_, index) =>
    addMonths(`${today.slice(0, 7)}-01`, index - (MONTHS - 1)).slice(0, 7),
  );
  const grid = new Map(months.map((month) => [month, { month, total: 0 }]));

  for (const row of rows) {
    const point = grid.get(row.receivedAt.slice(0, 7));
    if (point) point.total += 1;
  }

  return months.map((month) => grid.get(month) ?? { month, total: 0 });
}
