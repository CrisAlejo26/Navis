import { ALL_LOCAL_TABLES, createTableSql } from '@navis/shared';
import type { LocalDb } from './local-db';

export async function migrateJournal(db: LocalDb): Promise<void> {
    const existing = new Set(
        (
            await db.getAllAsync<{ name: string }>(
                "SELECT name FROM sqlite_master WHERE type = 'table'",
            )
        ).map((row) => row.name),
    );
    for (const table of ALL_LOCAL_TABLES) {
        if (!['journal_entries', 'journal_entry_audios'].includes(table.name)) continue;
        if (!existing.has(table.name)) await db.execAsync(createTableSql(table));
        await db.execAsync(
            `CREATE UNIQUE INDEX IF NOT EXISTS UQ_${table.name}_id ON ${table.name}(id)`,
        );
    }
    await db.execAsync(
        'CREATE INDEX IF NOT EXISTS IDX_journal_church_date ON journal_entries(church_id, deleted_at, occurred_at)',
    );
    await db.execAsync(
        'CREATE INDEX IF NOT EXISTS IDX_journal_audio_entry ON journal_entry_audios(church_id, entry_id)',
    );
}
