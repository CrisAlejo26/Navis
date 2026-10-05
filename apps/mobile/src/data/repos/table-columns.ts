import {
    createTableColumnSchema,
    updateTableColumnSchema,
    MAX_TABLE_COLUMNS,
    believerFieldMatchesType,
} from '@navis/shared';
import type { CreateTableColumnInput, UpdateTableColumnInput } from '@navis/shared';
import { newId, nowIso } from '../db';
import { tableDb, type TableContext } from './tables-context';
import { readTable } from './tables-reads';
import { encryptExistingColumn } from './table-password-migration';

export async function saveColumn(
    context: TableContext,
    tableId: string,
    input: CreateTableColumnInput | UpdateTableColumnInput,
    id?: string,
): Promise<void> {
    const db = await tableDb(context, true, tableId);
    const table = await readTable(context, tableId);
    const previous = table.columns.find((column) => column.id === id);
    if (id && !previous) throw new Error('not-found');
    if (!id && table.columns.length >= MAX_TABLE_COLUMNS) throw new Error('column-limit');
    const patch = updateTableColumnSchema.parse(input);
    const value = createTableColumnSchema.parse({
        ...previous,
        options: previous?.options ?? undefined,
        config: previous?.config ?? undefined,
        ...patch,
    });
    if (
        value.believerField &&
        (table.source !== 'believers' || !believerFieldMatchesType(value.believerField, value.type))
    )
        throw new Error('invalid-binding');
    const options =
        value.options?.map((option) => ({ ...option, value: option.value ?? newId() })) ?? null;
    if (options && new Set(options.map((option) => option.value)).size !== options.length)
        throw new Error('duplicate-option');
    const now = nowIso();
    if (previous) {
        await db.withTransactionAsync(async () => {
            if (value.type === 'password' && previous.type !== 'password')
                await encryptExistingColumn(db, tableId, previous.key);
            await db.runAsync(
                `UPDATE custom_table_columns SET label = ?, type = ?, required = ?, options = ?, config = ?, believer_field = ?, updated_at = ? WHERE id = ? AND table_id = ?`,
                value.label,
                value.type,
                Number(value.required ?? false),
                JSON.stringify(options),
                JSON.stringify(value.config ?? null),
                value.believerField ?? null,
                now,
                id ?? '',
                tableId,
            );
        });
    } else {
        const columnId = newId();
        const result = await db.runAsync(
            `INSERT INTO custom_table_columns (id, created_at, updated_at, table_id, key, label, type, position, required, options, config, believer_field)
            SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            WHERE (SELECT COUNT(*) FROM custom_table_columns WHERE table_id = ? AND is_active = 1) < ?`,
            columnId,
            now,
            now,
            tableId,
            `c_${columnId.replaceAll('-', '')}`,
            value.label,
            value.type,
            table.columns.length,
            Number(value.required ?? false),
            JSON.stringify(options),
            JSON.stringify(value.config ?? null),
            value.believerField ?? null,
            tableId,
            MAX_TABLE_COLUMNS,
        );
        if (!result.changes) throw new Error('column-limit');
    }
}
export async function deleteColumn(
    context: TableContext,
    tableId: string,
    id: string,
): Promise<void> {
    const db = await tableDb(context, true, tableId);
    const result = await db.runAsync(
        'UPDATE custom_table_columns SET is_active = 0, updated_at = ? WHERE id = ? AND table_id = ? AND is_active = 1',
        nowIso(),
        id,
        tableId,
    );
    if (!result.changes) throw new Error('not-found');
}
export async function reorderColumns(
    context: TableContext,
    tableId: string,
    ids: string[],
): Promise<void> {
    const db = await tableDb(context, true, tableId);
    await db.withTransactionAsync(async () => {
        const active = await db.getAllAsync<{ id: string }>(
            'SELECT id FROM custom_table_columns WHERE table_id = ? AND is_active = 1',
            tableId,
        );
        if (
            new Set(ids).size !== ids.length ||
            ids.length !== active.length ||
            active.some((column) => !ids.includes(column.id))
        )
            throw new Error('invalid-order');
        for (const [position, id] of ids.entries())
            await db.runAsync(
                'UPDATE custom_table_columns SET position = ?, updated_at = ? WHERE id = ? AND table_id = ?',
                position,
                nowIso(),
                id,
                tableId,
            );
    });
}
