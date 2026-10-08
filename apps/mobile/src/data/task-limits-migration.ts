import type { LocalDb } from './local-db';

/** Fase 7a: «vence el» y tiempo máximo en curso. Idempotente, como `migrateTaskSeries`. */
export async function migrateTaskLimits(db: LocalDb): Promise<void> {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tasks)');
    for (const name of ['due_date', 'in_progress_deadline'])
        if (!columns.some((column) => column.name === name))
            await db.execAsync(`ALTER TABLE tasks ADD COLUMN ${name} TEXT`);
}
