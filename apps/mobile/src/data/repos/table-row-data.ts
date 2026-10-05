import {
    rowValueMatchesType,
    rowValueMissing,
    type CustomTableWithColumns,
    type RowData,
} from '@navis/shared';
import { encryptCell } from '@/lib/tables/crypto';

export async function prepareRowData(
    table: CustomTableWithColumns,
    incoming: RowData,
    existing: RowData,
    creating: boolean,
): Promise<RowData> {
    const merged = { ...existing };
    for (const [key, value] of Object.entries(incoming)) {
        const column = table.columns.find((one) => one.key === key);
        if (!column) continue;
        if (table.source === 'believers' && column.believerField) throw new Error('bound-readonly');
        if (value === null || value === undefined) {
            delete merged[key];
            continue;
        }
        if (!rowValueMatchesType(column, value)) throw new Error('invalid-value');
        merged[key] =
            column.type === 'password' && typeof value === 'string'
                ? await encryptCell(value)
                : value;
    }
    for (const column of table.columns) {
        if (table.source === 'believers' && column.believerField) continue;
        if (
            (creating || Object.hasOwn(incoming, column.key)) &&
            rowValueMissing(column.required, merged[column.key])
        )
            throw new Error('required-value');
    }
    return merged;
}
