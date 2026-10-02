import { LOCAL_LIST_TABLES, createTableSql } from '@navis/shared';
import type { LocalDb } from './local-db';

export async function migrateLists(db: LocalDb): Promise<void> {
    for (const table of LOCAL_LIST_TABLES) {
        await db.execAsync(
            createTableSql(table).replace('CREATE TABLE', 'CREATE TABLE IF NOT EXISTS'),
        );
    }
    await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_lists_id ON lists(id);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_list_members ON list_members(list_id, believer_id);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_list_viewers_id ON list_viewers(id);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_list_grants ON list_grants(viewer_id, list_id);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_list_views_id ON list_views(id);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_list_access_log_id ON list_access_log(id);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_lists_slug ON lists(church_id, slug) WHERE deleted_at IS NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_lists_name ON lists(church_id, name) WHERE deleted_at IS NULL;
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_lists_token ON lists(share_token);
        CREATE INDEX IF NOT EXISTS IDX_lists_church ON lists(church_id, position);
        CREATE INDEX IF NOT EXISTS IDX_list_members_order ON list_members(list_id, position);
        CREATE INDEX IF NOT EXISTS IDX_list_members_believer ON list_members(believer_id);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_list_viewers_username ON list_viewers(church_id, username);
        CREATE UNIQUE INDEX IF NOT EXISTS UQ_list_viewers_believer ON list_viewers(church_id, believer_id);
        CREATE INDEX IF NOT EXISTS IDX_list_grants_list ON list_grants(list_id);
        CREATE INDEX IF NOT EXISTS IDX_list_views_recent ON list_views(list_id, viewed_at);
        CREATE INDEX IF NOT EXISTS IDX_list_views_visitor ON list_views(visitor_hash);
        CREATE INDEX IF NOT EXISTS IDX_list_access_log_recent ON list_access_log(list_id, at);
    `);
}
