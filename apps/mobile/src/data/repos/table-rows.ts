import {
    createTableRowSchema,
    rowDataSchema,
    updateTableRowSchema,
    type CreateTableRowInput,
    type UpdateTableRowInput,
} from '@navis/shared';
import { newId, nowIso } from '../db';
import { tableDb, type TableContext } from './tables-context';
import { readTable } from './tables-reads';
import { prepareRowData } from './table-row-data';

export async function createTableRow(
    context: TableContext,
    tableId: string,
    input: CreateTableRowInput,
): Promise<string> {
    const value = createTableRowSchema.parse(input),
        db = await tableDb(context, true, tableId);
    const table = await readTable(context, tableId);
    if (table.source === 'believers' && !value.believerId) throw new Error('believer-required');
    if (
        value.believerId &&
        (table.source !== 'believers' ||
            !(await db.getFirstAsync(
                'SELECT id FROM believers WHERE id = ? AND church_id = ? AND deleted_at IS NULL',
                value.believerId,
                context.churchId,
            )))
    )
        throw new Error('not-found');
    const data = await prepareRowData(table, value.data, {}, true),
        id = newId(),
        now = nowIso();
    await db.runAsync(
        'INSERT INTO custom_table_rows (id, created_at, updated_at, table_id, data, believer_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        id,
        now,
        now,
        tableId,
        JSON.stringify(data),
        value.believerId ?? null,
        context.userId,
    );
    return id;
}
export async function updateTableRow(
    context: TableContext,
    tableId: string,
    id: string,
    input: UpdateTableRowInput,
): Promise<void> {
    const db = await tableDb(context, true, tableId),
        value = updateTableRowSchema.parse(input);
    const row = await db.getFirstAsync<{ data: string }>(
        'SELECT data FROM custom_table_rows WHERE id = ? AND table_id = ? AND deleted_at IS NULL',
        id,
        tableId,
    );
    if (!row) throw new Error('not-found');
    const data = await prepareRowData(
        await readTable(context, tableId),
        value.data,
        rowDataSchema.parse(JSON.parse(row.data) as unknown),
        false,
    );
    await db.runAsync(
        'UPDATE custom_table_rows SET data = ?, updated_at = ? WHERE id = ? AND table_id = ? AND deleted_at IS NULL',
        JSON.stringify(data),
        nowIso(),
        id,
        tableId,
    );
}
export async function deleteTableRow(
    context: TableContext,
    tableId: string,
    id: string,
): Promise<void> {
    const db = await tableDb(context, true, tableId);
    const result = await db.runAsync(
        'UPDATE custom_table_rows SET deleted_at = ?, updated_at = ? WHERE id = ? AND table_id = ? AND deleted_at IS NULL',
        nowIso(),
        nowIso(),
        id,
        tableId,
    );
    if (!result.changes) throw new Error('not-found');
}
