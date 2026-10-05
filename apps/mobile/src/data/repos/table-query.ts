import { rowFiltersSchema, type CustomTableWithColumns, type RowFilter } from '@navis/shared';
import { columnSql, daySql, tableRowJoins } from './table-value-sql';
import { filterSql, type QueryParam } from './table-filter-sql';

export interface TableQuery {
    rowId?: string;
    search?: string;
    filters?: RowFilter[];
    sort?: string;
    order?: 'asc' | 'desc';
    lane?: { key: string; value: string | null };
    day?: { key: string; value: string | null };
}
export function compileTableQuery(
    table: CustomTableWithColumns,
    query: TableQuery,
): { from: string; params: QueryParam[]; order: string } {
    const clauses = [
        'r.table_id = ?',
        't.church_id = ?',
        't.deleted_at IS NULL',
        'r.deleted_at IS NULL',
    ];
    const params: QueryParam[] = [table.id, table.churchId];
    if (query.rowId) {
        clauses.push('r.id = ?');
        params.push(query.rowId);
    }
    const getColumn = (key: string) => {
        const column = table.columns.find((one) => one.key === key && one.type !== 'password');
        if (!column) throw new Error('invalid-column');
        return column;
    };
    for (const filter of rowFiltersSchema.parse(query.filters ?? [])) {
        const column = getColumn(filter.columnKey);
        const compiled = filterSql(
            column,
            column.type === 'date' ? daySql(table, column) : columnSql(table, column),
            filter,
        );
        clauses.push(`(${compiled.sql})`);
        params.push(...compiled.params);
    }
    if (query.search?.trim()) {
        const searchable = table.columns.filter((one) => one.type !== 'password');
        clauses.push(
            searchable.length
                ? `(${searchable.map((one) => `instr(lower(CAST(${columnSql(table, one)} AS TEXT)), lower(?)) > 0`).join(' OR ')})`
                : '0 = 1',
        );
        params.push(...searchable.map(() => query.search?.trim().slice(0, 200) ?? ''));
    }
    if (query.lane) {
        const column = getColumn(query.lane.key),
            field = columnSql(table, column);
        if (column.type !== 'single_select') throw new Error('invalid-lane');
        if (query.lane.value === null) {
            const values = column.options?.map((one) => one.value) ?? [];
            clauses.push(
                values.length
                    ? `(${field} IS NULL OR ${field} NOT IN (${values.map(() => '?').join(',')}))`
                    : '1 = 1',
            );
            params.push(...values);
        } else {
            clauses.push(`${field} = ?`);
            params.push(query.lane.value);
        }
    }
    if (query.day) {
        const column = getColumn(query.day.key);
        if (column.type !== 'date') throw new Error('invalid-day');
        const field = daySql(table, column);
        clauses.push(
            query.day.value === null ? `${field} IS NULL OR ${field} = ''` : `${field} = ?`,
        );
        if (query.day.value !== null) params.push(query.day.value);
    }
    const sort = query.sort ? columnSql(table, getColumn(query.sort)) : 'r.created_at';
    return {
        from: `${tableRowJoins} WHERE ${clauses.map((part) => `(${part})`).join(' AND ')}`,
        params,
        order: `${sort} ${query.order === 'desc' ? 'DESC' : 'ASC'}, r.id ASC`,
    };
}
