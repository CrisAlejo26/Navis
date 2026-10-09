import { createTableViewSchema, updateTableViewSchema } from '@navis/shared';
import type { CreateTableViewInput, UpdateTableViewInput } from '@navis/shared';
import { newId, nowIso } from '../db';
import { tableDb, type TableContext } from './tables-context';
import { readTable, readTableViews } from './tables-reads';
import { compileTableQuery } from './table-query';

export async function createView(
    context: TableContext,
    tableId: string,
    input: CreateTableViewInput,
): Promise<string> {
    const value = createTableViewSchema.parse(input);
    const db = await tableDb(context, true, tableId);
    const table = await readTable(context, tableId);
    const key = value.type === 'kanban' ? value.groupBy : value.dateColumn;
    if (
        !table.columns.some(
            (column) =>
                column.key === key &&
                column.type === (value.type === 'kanban' ? 'single_select' : 'date'),
        )
    )
        throw new Error('invalid-view');
    compileTableQuery(table, { filters: value.filters, sort: value.sortBy ?? undefined });
    const id = newId(),
        now = nowIso();
    await db.runAsync(
        `INSERT INTO custom_table_views (id, created_at, updated_at, table_id, name, type, group_by, date_column, filters, sort_by, sort_order, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, (SELECT COUNT(*) FROM custom_table_views WHERE table_id = ?))`,
        id,
        now,
        now,
        tableId,
        value.name,
        value.type,
        value.groupBy ?? null,
        value.dateColumn ?? null,
        JSON.stringify(value.filters ?? []),
        value.sortBy ?? null,
        value.sortOrder ?? 'desc',
        tableId,
    );
    return id;
}
export async function updateView(
    context: TableContext,
    tableId: string,
    id: string,
    input: UpdateTableViewInput,
): Promise<void> {
    const db = await tableDb(context, true, tableId);
    const previous = (await readTableViews(context, tableId)).find((view) => view.id === id);
    if (!previous) throw new Error('not-found');
    const value = { ...previous, ...updateTableViewSchema.parse(input) };
    compileTableQuery(await readTable(context, tableId), {
        filters: value.filters,
        sort: value.sortBy ?? undefined,
    });
    await db.runAsync(
        'UPDATE custom_table_views SET name = ?, filters = ?, sort_by = ?, sort_order = ?, updated_at = ? WHERE id = ? AND table_id = ?',
        value.name,
        JSON.stringify(value.filters),
        value.sortBy,
        value.sortOrder,
        nowIso(),
        id,
        tableId,
    );
}
export async function deleteView(
    context: TableContext,
    tableId: string,
    id: string,
): Promise<void> {
    const db = await tableDb(context, true, tableId);
    const result = await db.runAsync(
        'DELETE FROM custom_table_views WHERE id = ? AND table_id = ?',
        id,
        tableId,
    );
    if (!result.changes) throw new Error('not-found');
}
