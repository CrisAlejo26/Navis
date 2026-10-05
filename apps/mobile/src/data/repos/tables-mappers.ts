import { customTableSchema, customTableColumnSchema, customTableViewSchema } from '@navis/shared';
import type { CustomTable, CustomTableColumn, CustomTableView } from '@navis/shared';
import type { BackupRow } from '@/lib/backup/backup-format';

export function parseJson(value: unknown): unknown {
    if (typeof value !== 'string') return null;
    return JSON.parse(value) as unknown;
}
export function mapTable(row: BackupRow): CustomTable {
    return customTableSchema.parse({
        ...row,
        churchId: row.church_id,
        isActive: Boolean(row.is_active),
    });
}
export function mapColumn(row: BackupRow): CustomTableColumn {
    return customTableColumnSchema.parse({
        ...row,
        tableId: row.table_id,
        required: Boolean(row.required),
        isActive: Boolean(row.is_active),
        options: parseJson(row.options),
        config: parseJson(row.config),
        believerField: row.believer_field,
    });
}
export function mapView(row: BackupRow): CustomTableView {
    return customTableViewSchema.parse({
        ...row,
        tableId: row.table_id,
        groupBy: row.group_by,
        dateColumn: row.date_column,
        filters: parseJson(row.filters),
        sortBy: row.sort_by,
        sortOrder: row.sort_order,
    });
}
