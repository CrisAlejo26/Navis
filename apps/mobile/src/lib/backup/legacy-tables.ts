import type { Backup, BackupRow } from './backup-format';

function withoutDeletedAt(row: BackupRow): BackupRow {
    const copy = { ...row };
    delete copy.deleted_at;
    return copy;
}

/**
 * Las copias hechas antes del esquema 15 traen `deleted_at` en columnas y
 * vistas de tablas personalizadas, que la API no tiene. Se traducen al modelo
 * actual para que sigan restaurándose: la columna borrada queda desactivada y
 * la vista borrada no se restaura.
 */
export function upgradeLegacyTables(backup: Backup): void {
    const columns = backup.tables.custom_table_columns;
    if (columns) {
        backup.tables.custom_table_columns = columns.map((row) =>
            row.deleted_at == null
                ? withoutDeletedAt(row)
                : { ...withoutDeletedAt(row), is_active: 0 },
        );
    }
    const views = backup.tables.custom_table_views;
    if (views) {
        backup.tables.custom_table_views = views
            .filter((row) => row.deleted_at == null)
            .map(withoutDeletedAt);
    }
}
