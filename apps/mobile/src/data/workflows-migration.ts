import { ALL_LOCAL_TABLES, createTableSql } from '@navis/shared';
import type { LocalDb } from './local-db';

/**
 * Fase 7b: la tabla `workflows` y `tasks.workflow_id`. Idempotente y válida en
 * una base nueva (que ya trae ambas desde el esquema compartido).
 */
export async function migrateWorkflows(db: LocalDb): Promise<void> {
    const table = ALL_LOCAL_TABLES.find((one) => one.name === 'workflows');
    if (!table) throw new Error('workflows-schema-missing');
    const existing = await db.getFirstAsync<{ name: string }>(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'workflows'",
    );
    if (!existing) await db.execAsync(createTableSql(table));
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(tasks)');
    if (!columns.some((column) => column.name === 'workflow_id'))
        await db.execAsync('ALTER TABLE tasks ADD COLUMN workflow_id TEXT');
    await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS UQ_workflows_church_owner_name ON workflows(church_id, owner_id, name)',
    );
}
