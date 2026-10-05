import { addTableBelieversSchema, type AddTableBelieversInput } from '@navis/shared';
import { newId, nowIso } from '../db';
import { tableDb, type TableContext } from './tables-context';
import { readTable } from './tables-reads';

export async function tableBelieverCandidates(
    context: TableContext,
    tableId: string,
    search = '',
    page = 1,
): Promise<{ id: string; name: string; linked: number }[]> {
    const db = await tableDb(context, false, tableId);
    return db.getAllAsync(
        `SELECT b.id, trim(b.first_name || ' ' || b.last_name) name,
        EXISTS (SELECT 1 FROM custom_table_rows r WHERE r.table_id = ? AND r.believer_id = b.id AND r.deleted_at IS NULL) linked
        FROM believers b WHERE b.church_id = ? AND b.deleted_at IS NULL AND instr(lower(b.search_name), lower(?)) > 0 ORDER BY b.search_name, b.id LIMIT 20 OFFSET ?`,
        tableId,
        context.churchId,
        search,
        (page - 1) * 20,
    );
}
export async function addTableBelievers(
    context: TableContext,
    tableId: string,
    input: AddTableBelieversInput,
): Promise<void> {
    const db = await tableDb(context, true, tableId),
        value = addTableBelieversSchema.parse(input);
    if ((await readTable(context, tableId)).source !== 'believers')
        throw new Error('invalid-source');
    await db.withTransactionAsync(async () => {
        for (const id of new Set(value.believerIds)) {
            if (
                !(await db.getFirstAsync(
                    'SELECT id FROM believers WHERE id = ? AND church_id = ? AND deleted_at IS NULL',
                    id,
                    context.churchId,
                ))
            )
                throw new Error('not-found');
            const now = nowIso();
            await db.runAsync(
                `INSERT INTO custom_table_rows (id, created_at, updated_at, table_id, data, believer_id, created_by)
                SELECT ?, ?, ?, ?, '{}', ?, ? WHERE NOT EXISTS (SELECT 1 FROM custom_table_rows WHERE table_id = ? AND believer_id = ? AND deleted_at IS NULL)`,
                newId(),
                now,
                now,
                tableId,
                id,
                context.userId,
                tableId,
                id,
            );
        }
    });
}
