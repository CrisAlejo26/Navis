import { BadRequestException } from '@nestjs/common';
import { rowFiltersSchema, type RowFilter } from '@navis/shared';

/** `RowFilter[]` codificado en JSON en la URL, validado por forma (D30). */
export function parseRowFilters(raw: string | undefined): readonly RowFilter[] {
  if (!raw) return [];

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new BadRequestException('El parámetro de filtros no es JSON válido');
  }

  const parsed = rowFiltersSchema.safeParse(value);
  if (!parsed.success)
    throw new BadRequestException('El parámetro de filtros no tiene la forma esperada');
  return parsed.data;
}
