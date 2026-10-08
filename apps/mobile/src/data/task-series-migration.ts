import type { LocalDb } from './local-db';

export async function migrateTaskSeries(db: LocalDb): Promise<void> {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tasks)');
    for (const [name, type] of [
        ['repeat_options', 'TEXT'],
        ['repeat_pauses', 'TEXT'],
        ['repeat_stopped_at', 'TEXT'],
        ['manual_order', 'INTEGER'],
    ]) {
        if (!columns.some((column) => column.name === name))
            await db.execAsync(`ALTER TABLE tasks ADD COLUMN ${name} ${type}`);
    }
}
