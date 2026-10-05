import type { CustomTableColumn, RowFilter } from '@navis/shared';
export type QueryParam = string | number | null;

export function filterSql(
    column: CustomTableColumn,
    field: string,
    filter: RowFilter,
): { sql: string; params: QueryParam[] } {
    const { operator, value } = filter;
    if (column.type === 'password') throw new Error('invalid-filter');
    if (
        operator === 'contains' &&
        ['text', 'long_text', 'phone', 'email', 'url'].includes(column.type) &&
        typeof value === 'string'
    ) {
        return { sql: `instr(lower(CAST(${field} AS TEXT)), lower(?)) > 0`, params: [value] };
    }
    if (operator === 'equals' && column.type === 'checkbox' && typeof value === 'boolean') {
        return {
            sql: value
                ? `${field} IN (1, 'true')`
                : `(${field} IS NULL OR ${field} IN (0, 'false'))`,
            params: [],
        };
    }
    if (
        operator === 'in' &&
        ['single_select', 'multi_select'].includes(column.type) &&
        Array.isArray(value) &&
        value.every((item: unknown) => typeof item === 'string')
    ) {
        const values: string[] = value;
        if (!values.length) return { sql: '1 = 1', params: [] };
        return {
            sql:
                column.type === 'multi_select'
                    ? `EXISTS (SELECT 1 FROM json_each(CASE WHEN json_valid(${field}) THEN ${field} ELSE '[]' END) e WHERE e.value IN (${values.map(() => '?').join(',')}))`
                    : `${field} IN (${values.map(() => '?').join(',')})`,
            params: values,
        };
    }
    if (
        operator === 'between' &&
        ['number', 'currency', 'date'].includes(column.type) &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
    ) {
        const range = value as Record<string, unknown>;
        const bounds = column.type === 'date' ? [range.from, range.to] : [range.min, range.max];
        const parts: string[] = [],
            params: QueryParam[] = [];
        for (const [index, bound] of bounds.entries()) {
            if (bound === undefined || bound === null || bound === '') continue;
            if (
                column.type === 'date'
                    ? typeof bound !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(bound)
                    : typeof bound !== 'number' || !Number.isFinite(bound)
            )
                throw new Error('invalid-filter');
            if (typeof bound !== 'string' && typeof bound !== 'number')
                throw new Error('invalid-filter');
            parts.push(`${field} ${index === 0 ? '>=' : '<='} ?`);
            params.push(bound);
        }
        return { sql: parts.join(' AND ') || '1 = 1', params };
    }
    throw new Error('invalid-filter');
}
