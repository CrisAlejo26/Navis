import type { CustomTableColumn, CustomTableWithColumns, TableBelieverField } from '@navis/shared';

const fields: Record<TableBelieverField, string> = {
    fullName: "trim(b.first_name || ' ' || b.last_name)",
    firstName: 'b.first_name',
    lastName: "nullif(b.last_name, '')",
    phone: 'b.phone',
    email: 'b.email',
    status: 'b.status',
    congregation: 'g.name',
    arrivedAt: 'substr(b.arrived_at, 1, 10)',
    lastNoteAt: 'substr(b.last_note_at, 1, 10)',
    arrivalSite: 'b.arrival_site',
    bibleReadings: 'b.bible_readings',
    vivenciasReadings: 'b.vivencias_readings',
    bibleInstituteTimes: 'b.bible_institute_times',
};
export const tableRowJoins = `FROM custom_table_rows r
    JOIN custom_tables t ON t.id = r.table_id
    LEFT JOIN believers b ON b.id = r.believer_id AND b.church_id = t.church_id AND b.deleted_at IS NULL
    LEFT JOIN congregations g ON g.id = b.congregation_id AND g.church_id = t.church_id AND g.deleted_at IS NULL`;

export function columnSql(table: CustomTableWithColumns, column: CustomTableColumn): string {
    if (table.source === 'believers' && column.believerField) return fields[column.believerField];
    if (!/^[a-zA-Z0-9_-]+$/.test(column.key)) throw new Error('invalid-key');
    const raw = `json_extract(r.data, '$."${column.key}"')`;
    const field = `CASE WHEN json_extract(r.data, '$."${column.key}".navisCipher') = 1 THEN NULL ELSE ${raw} END`;
    if (column.type === 'number' || column.type === 'currency') {
        return `CASE WHEN json_type(r.data, '$."${column.key}"') IN ('integer', 'real') THEN ${field} END`;
    }
    return field;
}
export function daySql(table: CustomTableWithColumns, column: CustomTableColumn): string {
    const field = columnSql(table, column);
    return column.config?.includeTime
        ? `date(${field}, 'localtime')`
        : `date(substr(${field}, 1, 10))`;
}
