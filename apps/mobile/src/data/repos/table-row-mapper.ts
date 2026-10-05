import {
    rowDataSchema,
    rowValueMatchesType,
    type CustomTableRow,
    type CustomTableColumn,
} from '@navis/shared';
import type { BackupRow } from '@/lib/backup/backup-format';
import { cellEnvelope } from '@/lib/tables/crypto';

export function mapTableRow(
    row: BackupRow,
    id: string,
    columns: CustomTableColumn[],
    bound: CustomTableColumn[],
): CustomTableRow {
    const data = rowDataSchema.parse(JSON.parse(String(row.data)) as unknown);
    bound.forEach((column, index) => {
        data[column.key] = row[`v${index}`] ?? null;
    });
    const mismatches = columns
        .filter(
            (column) =>
                data[column.key] != null &&
                !cellEnvelope.safeParse(data[column.key]).success &&
                !rowValueMatchesType(column, data[column.key]),
        )
        .map((column) => column.key);
    for (const [key, value] of Object.entries(data))
        if (cellEnvelope.safeParse(value).success) data[key] = '••••••';
    return {
        id: String(row.id),
        tableId: id,
        data,
        mismatches,
        believerId: row.believer_id == null ? null : String(row.believer_id),
        believer:
            row.linked_id == null
                ? null
                : {
                      id: String(row.linked_id),
                      name: String(row.linked_name),
                      photoKey: row.linked_photo == null ? null : String(row.linked_photo),
                  },
        createdBy: row.created_by == null ? null : String(row.created_by),
        createdAt: String(row.created_at),
        updatedAt: String(row.updated_at),
    };
}
