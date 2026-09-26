import type { TableColumnKind, TableFilter } from '@navis/shared';

import type { CellValue, DataTableColumn } from './columns';
import type { RowData as TableRowData } from '@tanstack/react-table';

/** Sin mayúsculas ni acentos: quien busca «pulpito» espera encontrar «Púlpito». */
function fold(text: string): string {
    return text
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toLowerCase();
}

function isEmptyCell(cell: CellValue): boolean {
    return cell === null || cell === undefined || cell === '';
}

function isRange(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

/** Los días vienen como `AAAA-MM-DD` o ISO completo: se compara solo el día. */
const day = (cell: CellValue): string => String(cell).slice(0, 10);

function matchesNumber(filter: TableFilter, cell: number): boolean {
    const { operator, value } = filter;
    if (operator === 'between' && isRange(value)) {
        const { min, max } = value;
        return (typeof min !== 'number' || cell >= min) && (typeof max !== 'number' || cell <= max);
    }
    if (typeof value !== 'number') return false;
    if (operator === 'gt') return cell > value;
    if (operator === 'lt') return cell < value;
    return cell === value;
}

function matchesDate(filter: TableFilter, cell: string): boolean {
    const { operator, value } = filter;
    if (operator === 'between' && isRange(value)) {
        const { from, to } = value;
        return (typeof from !== 'string' || cell >= from) && (typeof to !== 'string' || cell <= to);
    }
    if (typeof value !== 'string') return false;
    if (operator === 'before') return cell < value;
    if (operator === 'after') return cell > value;
    return cell === value;
}

function matchesText(filter: TableFilter, cell: string): boolean {
    const { operator, value } = filter;
    if (typeof value !== 'string' && typeof value !== 'number') return false;
    const needle = fold(String(value));
    const hay = fold(cell);
    if (operator === 'equals') return hay === needle;
    if (operator === 'startsWith') return hay.startsWith(needle);
    return hay.includes(needle);
}

/**
 * ¿Esta celda cumple el filtro? Es la versión de **cliente** de lo que una API
 * hace con sus parámetros: la usan las tablas que traen la lista entera.
 */
export function matchesTableFilter(
    filter: TableFilter,
    cell: CellValue,
    kind: TableColumnKind,
): boolean {
    if (filter.operator === 'isEmpty') return isEmptyCell(cell);
    if (filter.operator === 'isNotEmpty') return !isEmptyCell(cell);
    if (isEmptyCell(cell)) return filter.operator === 'notIn';

    if (kind === 'boolean') return cell === filter.value;
    if (kind === 'select') {
        const list = Array.isArray(filter.value) ? (filter.value as unknown[]) : [];
        const found = list.includes(String(cell));
        return filter.operator === 'notIn' ? !found : found;
    }
    if (kind === 'number') return typeof cell === 'number' && matchesNumber(filter, cell);
    if (kind === 'date') return matchesDate(filter, day(cell));
    return matchesText(filter, String(cell));
}

/** Aplica todos los filtros (se suman: Y) a la lista completa. Sin filtros, la misma lista. */
export function applyClientFilters<TItem extends TableRowData>(
    items: readonly TItem[],
    columns: readonly DataTableColumn<TItem>[],
    filters: readonly TableFilter[],
): readonly TItem[] {
    if (filters.length === 0) return items;
    const byId = new Map(columns.map((column) => [column.id, column]));

    return items.filter((item) =>
        filters.every((filter) => {
            const column = byId.get(filter.columnId);
            if (!column?.value) return true;
            return matchesTableFilter(filter, column.value(item), column.kind);
        }),
    );
}

/**
 * El buscador en modo cliente: cada palabra tiene que aparecer en alguna de las
 * columnas buscables (por defecto, las de texto), sin importar mayúsculas ni
 * acentos. Lo hace la tabla y no `globalFilter` de TanStack porque su
 * `includesString` no ignora los acentos: «pulpi» no encontraba «Púlpito».
 */
export function applyClientSearch<TItem extends TableRowData>(
    items: readonly TItem[],
    columns: readonly DataTableColumn<TItem>[],
    search: string,
): readonly TItem[] {
    const words = fold(search).split(/\s+/).filter(Boolean);
    if (words.length === 0) return items;
    const searchable = columns.filter(
        (column) => column.value && (column.searchable ?? column.kind === 'text'),
    );

    return items.filter((item) => {
        const haystack = fold(
            searchable
                .map((column) => column.value?.(item))
                .filter(
                    (cell): cell is string | number =>
                        typeof cell === 'string' || typeof cell === 'number',
                )
                .join(' '),
        );
        return words.every((word) => haystack.includes(word));
    });
}
