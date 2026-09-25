import { BadRequestException } from '@nestjs/common';
import { isTableBelieverField, type RowFilter } from '@navis/shared';
import { Brackets, type SelectQueryBuilder } from 'typeorm';

import { believerFieldExists, believerFieldExpr } from '../database/believer-field-sql';
import { jsonFieldExpr, jsonFieldNumericExpr } from '../database/json-field-sql';
import { asDateRange, asNumericRange, asStringArray } from './table-row-filter-values';
import type { CustomTableRow } from './custom-table-row.entity';

type ColumnLike = { key: string; type: string; believerField?: string | null };

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
        // Una fila donde nunca se tocó la casilla no tiene la clave en el JSON
        // —no se guardó nunca `false`—, y eso también es «No»: la celda ya se
        // pinta así (`RowValueCell`). Sin el `OR ... IS NULL`, «No» no
        // encontraba las filas que nunca se marcaron.
        //
        // `json_extract` de SQLite devuelve `1`/`0` para un booleano del JSON y
        // `data::jsonb ->>` de Postgres devuelve `'true'`/`'false'`: se compara
        // con los dos para que la casilla filtre igual en los dos motores.
        if (filter.value) {
            qb.andWhere(`(${field} = :${p}text OR ${field} = :${p}num)`, {
                [`${p}text`]: 'true',
                [`${p}num`]: 1,
            });
        } else {
            qb.andWhere(`(${field} = :${p}text OR ${field} = :${p}num OR ${field} IS NULL)`, {
                [`${p}text`]: 'false',
                [`${p}num`]: 0,
            });
        }
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

/**
 * Un filtro sobre una columna vinculada: la condición se traduce contra
 * `believers` dentro de un `EXISTS` (RFC 0025 D12) — los valores no están en
 * el JSON de la fila, así que el `LIKE` de `applyRowFilter` no los vería.
 * Los operadores son los mismos que los de su tipo de columna, y las filas
 * sin creyente —o con el creyente ya fuera del catálogo— no encajan, igual
 * que una celda vacía no encaja en los filtros del JSON.
 */
export function applyBelieverRowFilter(
    qb: SelectQueryBuilder<CustomTableRow>,
    column: ColumnLike,
    filter: RowFilter,
    index: number,
): void {
    if (!column.believerField || !isTableBelieverField(column.believerField)) {
        throw new BadRequestException(`La columna «${column.key}» no está vinculada`);
    }
    const field = believerFieldExpr(column.believerField);
    const p = `f${String(index)}`;

    if (filter.operator === 'contains' && TEXT_LIKE.has(column.type)) {
        qb.andWhere(believerFieldExists(`LOWER(${field}) LIKE LOWER(:${p})`), {
            [p]: `%${String(filter.value)}%`,
        });
        return;
    }

    if (filter.operator === 'between' && NUMERIC.has(column.type)) {
        const { min, max } = asNumericRange(filter.value);
        if (min !== undefined)
            qb.andWhere(believerFieldExists(`${field} >= :${p}min`), { [`${p}min`]: min });
        if (max !== undefined)
            qb.andWhere(believerFieldExists(`${field} <= :${p}max`), { [`${p}max`]: max });
        return;
    }

    if (filter.operator === 'between' && column.type === 'date') {
        const { from, to } = asDateRange(filter.value);
        if (from) qb.andWhere(believerFieldExists(`${field} >= :${p}from`), { [`${p}from`]: from });
        if (to) qb.andWhere(believerFieldExists(`${field} <= :${p}to`), { [`${p}to`]: to });
        return;
    }

    throw new BadRequestException(
        `El operador «${filter.operator}» no corresponde al tipo de «${column.key}»`,
    );
}
