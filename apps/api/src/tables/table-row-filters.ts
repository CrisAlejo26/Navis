import { BadRequestException } from '@nestjs/common';
import type { RowFilter } from '@navis/shared';
import { Brackets, type SelectQueryBuilder } from 'typeorm';

import { jsonFieldExpr, jsonFieldNumericExpr } from '../database/json-field-sql';
import { asDateRange, asNumericRange, asStringArray } from './table-row-filter-values';
import type { CustomTableRow } from './custom-table-row.entity';

type ColumnLike = { key: string; type: string };

const TEXT_LIKE = new Set(['text', 'long_text', 'email', 'phone', 'url']);
const NUMERIC = new Set(['number', 'currency']);

/**
 * Añade la condición de un filtro a la consulta de filas, validado contra las
 * columnas reales de la tabla (D30): una columna que no existe, o un operador
 * que no le corresponde a su tipo, se rechaza con 400 en vez de ignorarse.
 */
export function applyRowFilter(
  qb: SelectQueryBuilder<CustomTableRow>,
  columns: readonly ColumnLike[],
  filter: RowFilter,
  index: number,
): void {
  const column = columns.find((one) => one.key === filter.columnKey);
  if (!column) throw new BadRequestException(`La columna «${filter.columnKey}» no existe`);
  if (column.type === 'password') {
    throw new BadRequestException('La contraseña no se puede filtrar (D29)');
  }

  const p = `f${String(index)}`;
  const field = jsonFieldExpr('row.data', column.key);

  if (filter.operator === 'contains' && TEXT_LIKE.has(column.type)) {
    qb.andWhere(`LOWER(${field}) LIKE LOWER(:${p})`, { [p]: `%${String(filter.value)}%` });
    return;
  }

  if (filter.operator === 'between' && NUMERIC.has(column.type)) {
    const { min, max } = asNumericRange(filter.value);
    const numeric = jsonFieldNumericExpr('row.data', column.key);
    if (min !== undefined) qb.andWhere(`${numeric} >= :${p}min`, { [`${p}min`]: min });
    if (max !== undefined) qb.andWhere(`${numeric} <= :${p}max`, { [`${p}max`]: max });
    return;
  }

  if (filter.operator === 'between' && column.type === 'date') {
    const { from, to } = asDateRange(filter.value);
    if (from) qb.andWhere(`${field} >= :${p}from`, { [`${p}from`]: from });
    if (to) qb.andWhere(`${field} <= :${p}to`, { [`${p}to`]: to });
    return;
  }

  if (filter.operator === 'equals' && column.type === 'checkbox') {
    qb.andWhere(`${field} = :${p}`, { [p]: filter.value ? 'true' : 'false' });
    return;
  }

  if (filter.operator === 'in' && column.type === 'single_select') {
    const values = asStringArray(filter.value);
    if (values.length > 0) qb.andWhere(`${field} IN (:...${p})`, { [p]: values });
    return;
  }

  if (filter.operator === 'in' && column.type === 'multi_select') {
    const values = asStringArray(filter.value);
    if (values.length === 0) return;
    // El array de una selección múltiple sigue siendo el JSON entero de esa
    // celda: «contiene alguna de las opciones elegidas» se comprueba como
    // subcadena de su texto, sin un JOIN por valor.
    qb.andWhere(
      new Brackets((sub) => {
        values.forEach((value, i) => {
          sub.orWhere(`${field} LIKE :${p}v${String(i)}`, {
            [`${p}v${String(i)}`]: `%"${value}"%`,
          });
        });
      }),
    );
    return;
  }

  throw new BadRequestException(
    `El operador «${filter.operator}» no corresponde al tipo de «${filter.columnKey}»`,
  );
}
