import type { RowFilter } from '@navis/shared';

/** Sustituye o quita el filtro de una columna, sin tocar los demás. */
export function withFilter(
  filters: readonly RowFilter[],
  columnKey: string,
  filter: RowFilter | null,
): RowFilter[] {
  const sin = filters.filter((one) => one.columnKey !== columnKey);
  return filter ? [...sin, filter] : sin;
}

export function filterFor(filters: readonly RowFilter[], columnKey: string): RowFilter | undefined {
  return filters.find((one) => one.columnKey === columnKey);
}

/** Lo que viaja en la URL: vacío si no hay ninguno, para no ensuciar la clave de caché. */
export function encodeFilters(filters: readonly RowFilter[]): string | undefined {
  return filters.length > 0 ? JSON.stringify(filters) : undefined;
}
