import type { LocalDb } from '@/data/db';
import type { BackupRow } from './backup-format';

/** Lotes pequeños: menos cruces del puente nativo y menos de 999 parámetros SQL. */
export async function restoreRows(db: LocalDb, table: string, rows: BackupRow[]): Promise<void> {
    let offset = 0;
    while (offset < rows.length) {
        const columns = Object.keys(rows[offset]).sort();
        const shape = columns.join(',');
        const limit = Math.max(1, Math.floor(900 / Math.max(1, columns.length)));
        const batch: BackupRow[] = [];
        while (
            offset < rows.length &&
            batch.length < limit &&
            Object.keys(rows[offset]).sort().join(',') === shape
        ) {
            batch.push(rows[offset++]);
        }
        const placeholders = `(${columns.map(() => '?').join(', ')})`;
        await db.runAsync(
            `INSERT INTO "${table}" (${columns.map((column) => `"${column}"`).join(', ')}) VALUES ${batch.map(() => placeholders).join(', ')}`,
            ...batch.flatMap((row) => columns.map((column) => row[column])),
        );
    }
}
