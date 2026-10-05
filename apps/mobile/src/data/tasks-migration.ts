import { ALL_LOCAL_TABLES, LOCAL_TASK_TABLES, createTableSql } from '@navis/shared';
import type { LocalDb } from './local-db';

/** Called inside the versioned database transaction, also safe on a fresh database. */
export async function migrateTasks(db: LocalDb): Promise<void> {
    const existing = new Set(
        (
            await db.getAllAsync<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type = 'table'",
            )
        ).map((row) => row.name),
    );
    const names = new Set([
        ...LOCAL_TASK_TABLES.map((table) => table.name),
        'tasks',
        'tags',
        'task_tags',
        'task_occurrences',
    ]);
    for (const table of ALL_LOCAL_TABLES) {
        if (!names.has(table.name)) continue;
        if (!existing.has(table.name)) await db.execAsync(createTableSql(table));
        await db.execAsync(
            `CREATE UNIQUE INDEX IF NOT EXISTS UQ_${table.name}_id ON ${table.name}(id)`,
        );
    }
    for (const kind of ['task', 'habit']) {
        await db.execAsync(
            `CREATE UNIQUE INDEX IF NOT EXISTS UQ_${kind}_occurrences ON ${kind}_occurrences(${kind}_id, date)`,
        );
        await db.execAsync(
            `CREATE UNIQUE INDEX IF NOT EXISTS UQ_${kind}_tags ON ${kind}_tags(${kind}_id, tag_id)`,
        );
        await db.execAsync(
            `CREATE UNIQUE INDEX IF NOT EXISTS UQ_${kind}_reminders ON ${kind}_reminders(${kind}_id)`,
        );
        await db.execAsync(
            `CREATE UNIQUE INDEX IF NOT EXISTS UQ_${kind}_reminder_tags ON ${kind}_reminder_tags(reminder_id, tag_id)`,
        );
        await db.execAsync(
            `CREATE INDEX IF NOT EXISTS IDX_${kind}s_church_owner_date ON ${kind}s(church_id, owner_id, date)`,
        );
    }
    await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS UQ_tags_church_owner_name ON tags(church_id, owner_id, name)',
    );
    await db.execAsync(
        'CREATE UNIQUE INDEX IF NOT EXISTS UQ_task_streak_cache ON task_streak_cache(church_id, owner_id)',
    );
}
