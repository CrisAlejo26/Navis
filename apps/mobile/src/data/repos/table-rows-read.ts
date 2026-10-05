import { rowDataSchema, type CustomTableRow } from '@navis/shared';
import type { BackupRow } from '@/lib/backup/backup-format';
import { decryptCell } from '@/lib/tables/crypto';
import { tableDb, type TableContext } from './tables-context';
import { readTable } from './tables-reads';
import { compileTableQuery, type TableQuery } from './table-query';
import { columnSql, daySql } from './table-value-sql';
import { mapTableRow } from './table-row-mapper';

export interface RowPage {
    items: CustomTableRow[];
    total: number;
    page: number;
}
export async function readTableRows(
    context: TableContext,
    id: string,
    query: TableQuery = {},
    page = 1,
    size = 40,
): Promise<RowPage> {
    const db = await tableDb(context, false, id),
        table = await readTable(context, id);
    const compiled = compileTableQuery(table, query);
    const limit = Math.max(1, Math.min(200, Math.floor(size))),
        offset = (Math.max(1, Math.floor(page)) - 1) * limit;
    const total = await db.getFirstAsync<{ total: number }>(
        `SELECT COUNT(*) total ${compiled.from}`,
        ...compiled.params,
    );
    const bound = table.columns.filter(
        (column) => table.source === 'believers' && column.believerField,
    );
    const projection = bound
        .map((column, index) => `${columnSql(table, column)} AS v${index}`)
        .join(', ');
    const rows = await db.getAllAsync<BackupRow>(
        `SELECT r.*, b.id AS linked_id, trim(b.first_name || ' ' || b.last_name) AS linked_name, b.photo_key AS linked_photo ${projection ? ', ' + projection : ''} ${compiled.from} ORDER BY ${compiled.order} LIMIT ? OFFSET ?`,
        ...compiled.params,
        limit,
        offset,
    );
    const items = rows.map((row) => mapTableRow(row, id, table.columns, bound));
    return { items, total: total?.total ?? 0, page };
}
export async function readCalendarCounts(
    context: TableContext,
    id: string,
    query: TableQuery,
    key: string,
    from: string,
    to: string,
): Promise<Record<string, number>> {
    const db = await tableDb(context, false, id),
        table = await readTable(context, id);
    const column = table.columns.find((one) => one.key === key && one.type === 'date');
    if (!column) throw new Error('invalid-date-column');
    const compiled = compileTableQuery(table, query),
        day = daySql(table, column);
    const counts = await db.getAllAsync<{ day: string; total: number }>(
        `SELECT ${day} day, COUNT(*) total ${compiled.from} AND ${day} >= ? AND ${day} <= ? GROUP BY ${day}`,
        ...compiled.params,
        from,
        to,
    );
    return Object.fromEntries(counts.map((count) => [count.day, count.total]));
}
export async function revealPassword(
    context: TableContext,
    tableId: string,
    rowId: string,
    key: string,
): Promise<string> {
    const db = await tableDb(context, true, tableId),
        table = await readTable(context, tableId);
    if (!table.columns.some((one) => one.key === key && one.type === 'password'))
        throw new Error('invalid-column');
    const row = await db.getFirstAsync<{ data: string }>(
        'SELECT data FROM custom_table_rows WHERE id = ? AND table_id = ? AND deleted_at IS NULL',
        rowId,
        tableId,
    );
    if (!row) throw new Error('not-found');
    return decryptCell(rowDataSchema.parse(JSON.parse(row.data) as unknown)[key]);
}
