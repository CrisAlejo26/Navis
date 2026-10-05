import { createCustomTableSchema, updateCustomTableSchema } from '@navis/shared';
import type { CreateCustomTableInput, UpdateCustomTableInput } from '@navis/shared';
import { newId, nowIso } from '../db';
import { tableDb, type TableContext } from './tables-context';

export async function createTable(
    context: TableContext,
    input: CreateCustomTableInput,
): Promise<string> {
    const value = createCustomTableSchema.parse(input);
    const db = await tableDb(context, true);
    const id = newId(),
        now = nowIso();
    await db.runAsync(
        `INSERT INTO custom_tables
        (id, created_at, updated_at, church_id, name, slug, icon, accent, position, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, (SELECT COUNT(*) FROM custom_tables WHERE church_id = ?), ?)`,
        id,
        now,
        now,
        context.churchId,
        value.name,
        id,
        value.icon,
        value.accent ?? 'primary',
        context.churchId,
        context.userId,
    );
    return id;
}
export async function updateTable(
    context: TableContext,
    id: string,
    input: UpdateCustomTableInput,
): Promise<void> {
    const value = updateCustomTableSchema.parse(input);
    const db = await tableDb(context, true, id);
    const fields = {
        name: value.name,
        icon: value.icon,
        accent: value.accent,
        position: value.position,
        is_active: value.isActive === undefined ? undefined : Number(value.isActive),
        source: value.source,
    };
    await db.withTransactionAsync(async () => {
        for (const [key, field] of Object.entries(fields)) {
            if (field === undefined) continue;
            await db.runAsync(
                `UPDATE custom_tables SET "${key}" = ?, updated_at = ? WHERE id = ? AND church_id = ?`,
                field,
                nowIso(),
                id,
                context.churchId,
            );
        }
    });
}
export async function deleteTable(context: TableContext, id: string): Promise<void> {
    const db = await tableDb(context, true, id);
    await db.runAsync(
        'UPDATE custom_tables SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ?',
        nowIso(),
        nowIso(),
        id,
        context.churchId,
    );
}
