import {
  addMonths,
  prophecyState,
  waitingDays,
  type PropheciesStats,
  type ProphecyMonth,
  type ProphecyState,
} from '@navis/shared';

/** Lo mínimo que hace falta de cada fila para las cuentas. Sin cuerpo ni búsqueda. */
export interface StatsRow {
  id: string;
  title: string;
  receivedAt: string;
  fulfilledAt: string | null;
  lastFulfillmentAt: string | null;
}

/** Cuántos meses cubre el gráfico de la portada (§6.2). */
const MONTHS = 12;

/**
 * Las cuentas de la portada, calculadas sobre las filas de esa persona.
 *
 * Se resuelve en memoria a partir de **una sola consulta** y no con seis
 * agregados en SQL, por dos motivos: la mediana no se escribe igual en Postgres
 * y en SQLite —y aquí tiene que dar lo mismo en los dos—, y una colección
 * personal cabe de sobra (son las profecías de una persona, no de una iglesia).
 */
export function summarize(rows: readonly StatsRow[], today: string): PropheciesStats {
  const byState: Record<ProphecyState, number> = { espera: 0, camino: 0, cumplida: 0 };
  const waits: number[] = [];
  let fulfilledThisYear = 0;
  let receivedThisYear = 0;
  let longest: PropheciesStats['longestWaiting'] = null;
  const year = today.slice(0, 4);

  for (const row of rows) {
    byState[prophecyState(row)] += 1;
    if (row.receivedAt.startsWith(year)) receivedThisYear += 1;
    if (row.fulfilledAt?.startsWith(year)) fulfilledThisYear += 1;

    const waited = waitingDays(row, today);
    if (row.fulfilledAt) waits.push(waited);
    else if (!longest || waited > longest.waitingDays) {
      longest = { id: row.id, title: row.title, waitingDays: waited };
    }
  }

  return {
    total: rows.length,
    byState,
    fulfilledThisYear,
    receivedThisYear,
    // `null` y no `0`: cero por ciento y «todavía no hay nada» son cosas
    // distintas y la portada las pinta distinto (§6.2).
    fulfillmentRate: rows.length === 0 ? null : byState.cumplida / rows.length,
    medianWaitingDays: median(waits),
    monthly: monthlyGrid(rows, today),
    longestWaiting: longest,
  };
}

/**
 * La **mediana**, no la media: una sola profecía de quince años desplazaría la
 * media hasta dejar de describir el caso normal (§6.2).
 */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

/**
 * Los últimos doce meses, **con los vacíos incluidos y a cero**.
 *
 * Un gráfico al que le faltan los meses sin datos miente sobre la forma: junta
 * dos meses separados por un año y los pinta como si fueran seguidos.
 */
export function monthlyGrid(rows: readonly StatsRow[], today: string): ProphecyMonth[] {
  const months = Array.from({ length: MONTHS }, (_, index) =>
    addMonths(`${today.slice(0, 7)}-01`, index - (MONTHS - 1)).slice(0, 7),
  );
  const grid = new Map(months.map((month) => [month, { month, received: 0, fulfilled: 0 }]));

  for (const row of rows) {
    const received = grid.get(row.receivedAt.slice(0, 7));
    if (received) received.received += 1;

    const fulfilled = row.fulfilledAt ? grid.get(row.fulfilledAt.slice(0, 7)) : undefined;
    if (fulfilled) fulfilled.fulfilled += 1;
  }

  return months.map((month) => grid.get(month) ?? { month, received: 0, fulfilled: 0 });
}
