import { addMonths, type EntryKind, type JournalMonth, type JournalStats } from '@navis/shared';

/** Lo mínimo que hace falta de cada fila para las cuentas. Sin título ni texto. */
export interface StatsRow {
  kind: EntryKind;
  occurredAt: string;
  remindAt: string | null;
  remindDoneAt: string | null;
}

/** Cuántos meses cubre el gráfico de la portada (§6.2). */
const MONTHS = 12;

/** Ninguna de cada tipo. Escrito, y no derivado, para que falte una si se añade un tipo. */
const EMPTY_BY_KIND: Record<EntryKind, number> = {
  observacion: 0,
  testimonio: 0,
  sueno: 0,
  bienHecho: 0,
  correccion: 0,
  oracion: 0,
  decision: 0,
};

/**
 * Las cuentas de la portada, calculadas sobre las filas de esa iglesia.
 *
 * Se resuelve en memoria a partir de **una sola consulta**, con las cinco
 * columnas que hacen falta y ni una más (mismo motivo que `ProphecyStatsService`,
 * RFC 0004 §6.2): las cuentas no pueden derivarse del listado paginado.
 */
export function summarize(rows: readonly StatsRow[], today: string): JournalStats {
  const byKind: Record<EntryKind, number> = { ...EMPTY_BY_KIND };
  let pendingReminders = 0;
  let thisMonth = 0;
  const month = today.slice(0, 7);

  for (const row of rows) {
    byKind[row.kind] += 1;
    // «Sin atender», no «vencido»: mismo criterio que el filtro del listado.
    if (row.remindAt && !row.remindDoneAt) pendingReminders += 1;
    if (row.occurredAt.startsWith(month)) thisMonth += 1;
  }

  return {
    total: rows.length,
    byKind,
    pendingReminders,
    thisMonth,
    monthly: monthlyGrid(rows, today),
  };
}

/**
 * Los últimos doce meses, **con los vacíos incluidos y a cero**.
 *
 * Un gráfico al que le faltan los meses sin datos miente sobre la forma: junta
 * dos meses separados por un año y los pinta como si fueran seguidos.
 */
export function monthlyGrid(rows: readonly StatsRow[], today: string): JournalMonth[] {
  const months = Array.from({ length: MONTHS }, (_, index) =>
    addMonths(`${today.slice(0, 7)}-01`, index - (MONTHS - 1)).slice(0, 7),
  );
  const grid = new Map(months.map((month) => [month, { month, total: 0 }]));

  for (const row of rows) {
    const bucket = grid.get(row.occurredAt.slice(0, 7));
    if (bucket) bucket.total += 1;
  }

  return months.map((month) => grid.get(month) ?? { month, total: 0 });
}
