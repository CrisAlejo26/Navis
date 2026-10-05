import type { CustomTable, CustomTableWithColumns, CustomTableView } from '@navis/shared';
import type { BackupRow } from '@/lib/backup/backup-format';
import { tableDb, type TableContext } from './tables-context';
import { mapTable, mapColumn, mapView } from './tables-mappers';

export async function readTables(context: TableContext): Promise<CustomTable[]> {
    const db = await tableDb(context);
    return (
        await db.getAllAsync<BackupRow>(
            'SELECT * FROM custom_tables WHERE church_id = ? AND deleted_at IS NULL ORDER BY position, id',
            context.churchId,
        )
    ).map(mapTable);
}
export async function readTable(
    context: TableContext,
    id: string,
): Promise<CustomTableWithColumns> {
    const db = await tableDb(context, false, id);
    const row = await db.getFirstAsync<BackupRow>(
        'SELECT * FROM custom_tables WHERE id = ? AND church_id = ?',
        id,
        context.churchId,
    );
    if (!row) throw new Error('not-found');
    const columns = (
        await db.getAllAsync<BackupRow>(
            'SELECT * FROM custom_table_columns WHERE table_id = ? AND is_active = 1 ORDER BY position, id',
            id,
        )
    ).map(mapColumn);
    return { ...mapTable(row), columns };
}
export async function readTableViews(
    context: TableContext,
    id: string,
): Promise<CustomTableView[]> {
    const db = await tableDb(context, false, id);
    return (
        await db.getAllAsync<BackupRow>(
            'SELECT * FROM custom_table_views WHERE table_id = ? ORDER BY position, id',
            id,
        )
    ).map(mapView);
}
