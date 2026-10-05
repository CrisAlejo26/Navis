import { rowDataSchema } from '@navis/shared';
import type { Backup } from '@/lib/backup/backup-format';
import { cellEnvelope, decryptCell } from './crypto';

export async function validateTableBackup(backup: Backup): Promise<void> {
    const tables = new Map((backup.tables.custom_tables ?? []).map((row) => [row.id, row]));
    const churches = new Set((backup.tables.churches ?? []).map((row) => row.id));
    const believers = new Map((backup.tables.believers ?? []).map((row) => [row.id, row]));
    const passwords = (backup.tables.custom_table_columns ?? []).filter(
        (column) => column.type === 'password',
    );
    for (const table of tables.values())
        if (!churches.has(table.church_id)) throw new Error('invalid-table-parent');
    for (const name of ['custom_table_columns', 'custom_table_views', 'custom_table_rows']) {
        for (const row of backup.tables[name] ?? []) {
            const table = tables.get(row.table_id);
            if (!table) throw new Error('invalid-table-parent');
            if (name !== 'custom_table_rows') continue;
            if (
                row.believer_id != null &&
                believers.get(row.believer_id)?.church_id !== table.church_id
            )
                throw new Error('invalid-table-believer');
            const data = rowDataSchema.parse(JSON.parse(String(row.data)) as unknown);
            for (const column of passwords) {
                const value = data[String(column.key)];
                if (column.table_id === row.table_id && typeof value === 'string')
                    throw new Error('unencrypted-password-backup');
            }
            for (const value of Object.values(data)) {
                if (cellEnvelope.safeParse(value).success) {
                    if (!backup.tableKeys) throw new Error('missing-backup-keys');
                    await decryptCell(value);
                }
            }
        }
    }
}
