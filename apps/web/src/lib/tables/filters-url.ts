import {
    rowFilterSchema,
    type CustomTableColumn,
    type FilterOperator,
    type RowFilter,
    type TableColumnType,
} from '@navis/shared';
import { useSearchParams } from 'react-router';

import { NUMERIC_TYPES, TEXT_TYPES } from '@/lib/tables/column-types';
import { encodeFilters } from '@/lib/tables/filters';

/**
 * El operador que le toca a un tipo de columna: el mismo reparto que hace la
 * API en `table-row-filters.ts` (RFC 0021 D30). La contraseña no tiene
 * operador: no se puede filtrar (D29).
 */
export function operatorFor(type: TableColumnType): FilterOperator | undefined {
    if (TEXT_TYPES.has(type)) return 'contains';
    if (NUMERIC_TYPES.has(type)) return 'between';
    if (type === 'date') return 'between';
    if (type === 'checkbox') return 'equals';
    if (type === 'single_select' || type === 'multi_select') return 'in';
    return undefined;
}

/** Las columnas a las que se les puede poner filtro, en su orden. */
export function filterableColumns(columns: readonly CustomTableColumn[]): CustomTableColumn[] {
    return columns.filter((one) => one.type !== 'password');
}

/**
 * Valida lo que llega de la URL contra las columnas reales de la tabla: una
 * columna que ya no existe, un operador que no le corresponde a su tipo o un
 * texto que no es JSON se **descartan**, no se dejan pasar — lo que viaja en
 * la URL lo escribe cualquiera. Igual que la API responde 400 (D30), el
 * cliente no se lo traga en silencio: simplemente lo quita.
 */
export function parseUrlFilters(
    raw: string | undefined | null,
    columns: readonly CustomTableColumn[],
): RowFilter[] {
    if (!raw) return [];

    let value: unknown;
    try {
        value = JSON.parse(raw);
    } catch {
        return [];
    }
    if (!Array.isArray(value)) return [];

    const byKey = new Map(columns.map((one) => [one.key, one]));
    const result: RowFilter[] = [];

    for (const one of value) {
        const parsed = rowFilterSchema.safeParse(one);
        if (!parsed.success) continue;

        const column = byKey.get(parsed.data.columnKey);
        if (!column || parsed.data.operator !== operatorFor(column.type)) continue;
        result.push(parsed.data);
    }

    return result;
}

/**
 * Los filtros de la cuadrícula viven en la URL, igual que la búsqueda y la
 * página de los creyentes: un enlace con `?f=` reproduce el filtrado tal
 * cual, y el botón de atrás los va quitando. Si no hay, la clave no existe —
 * para no ensuciar la caché (misma razón que `encodeFilters`).
 */
export function useTableFilters(columns: readonly CustomTableColumn[]): {
    filters: RowFilter[];
    setFilters: (filters: readonly RowFilter[]) => void;
} {
    const [params, setParams] = useSearchParams();
    const filters = parseUrlFilters(params.get('f'), columns);

    const setFilters = (next: readonly RowFilter[]) => {
        setParams(
            (previous) => {
                const url = new URLSearchParams(previous);
                const encoded = encodeFilters(next);
                if (encoded) url.set('f', encoded);
                else url.delete('f');
                url.delete('page');
                return url;
            },
            { replace: true },
        );
    };

    return { filters, setFilters };
}
