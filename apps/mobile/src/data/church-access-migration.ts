import { LOCAL_TABLES, LOCAL_INDEXES, createTableSql, createIndexSql } from '@navis/shared';
import type { LocalDb } from './local-db';
import { repairChurchAccess } from './church-access-repair';

export async function migrateChurchAccess(db: LocalDb): Promise<void> {
    const table = LOCAL_TABLES.find((one) => one.name === 'church_members');
    if (!table) throw new Error('missing-church-members-schema');
    await db.execAsync(createTableSql(table).replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS'));
    for (const index of LOCAL_INDEXES.filter((one) => one.table === 'church_members')) {
        await db.execAsync(
            createIndexSql(index).replace(
                /^CREATE (UNIQUE )?INDEX/,
                'CREATE $1INDEX IF NOT EXISTS',
            ),
        );
    }
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(local_user)');
    if (!columns.some((one) => one.name === 'active_church_id')) {
        await db.execAsync('ALTER TABLE local_user ADD COLUMN active_church_id TEXT');
    }
    await repairChurchAccess(db);
    await db.runAsync(`UPDATE local_user SET active_church_id = (
        SELECT c.id FROM church_members m JOIN churches c ON c.id = m.church_id
        WHERE m.user_id = local_user.id AND m.deleted_at IS NULL AND c.deleted_at IS NULL
        ORDER BY c.created_at, c.id LIMIT 1
    ) WHERE active_church_id IS NULL`);
}
