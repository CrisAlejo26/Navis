import { ALL_LOCAL_TABLES, createTableSql } from '@navis/shared';
import type { LocalDb } from './local-db';

/**
 * Fase 7c: la tabla `task_time_entries`. Idempotente y válida en una base
 * nueva, que ya la trae desde el esquema compartido.
 */
export async function migrateTaskTime(db: LocalDb): Promise<void> {
    const table = ALL_LOCAL_TABLES.find((one) => one.name === 'task_time_entries');
    if (!table) throw new Error('task-time-schema-missing');
    const existing = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'task_time_entries'",
    );
    if (!existing) await db.execAsync(createTableSql(table));
    await db.execAsync(
        'CREATE INDEX IF NOT EXISTS IDX_task_time_church_owner_started ON task_time_entries(church_id, owner_id, started_at)',
    );
}
