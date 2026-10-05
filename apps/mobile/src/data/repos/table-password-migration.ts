import { rowDataSchema } from '@navis/shared';
import type { LocalDb } from '../local-db';
import { encryptCell } from '@/lib/tables/crypto';

/** Changing text to password must also protect existing cells at rest. */
export async function encryptExistingColumn(
    db: LocalDb,
    tableId: string,
    key: string,
): Promise<void> {
    let offset = 0;
    while (true) {
        const rows = await db.getAllAsync<{ id: string; data: string }>(
            'SELECT id, data FROM custom_table_rows WHERE table_id = ? ORDER BY id LIMIT 100 OFFSET ?',
            tableId,
            offset,
        );
        for (const row of rows) {
            const data = rowDataSchema.parse(JSON.parse(row.data) as unknown);
            if (typeof data[key] !== 'string') continue;
            data[key] = await encryptCell(data[key]);
            await db.runAsync(
                'UPDATE custom_table_rows SET data = ? WHERE id = ? AND table_id = ?',
                JSON.stringify(data),
                row.id,
                tableId,
            );
        }
        if (rows.length < 100) break;
        offset += 100;
    }
}
