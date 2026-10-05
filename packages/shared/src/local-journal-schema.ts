import type { LocalTable } from './local-schema';

const base: LocalTable['columns'] = [
    { name: 'id', type: 'text', pk: true },
    { name: 'created_at', type: 'text' },
    { name: 'updated_at', type: 'text' },
    { name: 'deleted_at', type: 'text', nullable: true },
];
export const LOCAL_JOURNAL_TABLES: LocalTable[] = [
    {
        name: 'journal_entries',
        mirror: 'JournalEntry',
        columns: [
            ...base,
            { name: 'church_id', type: 'text' },
            { name: 'title', type: 'text' },
            { name: 'kind', type: 'text' },
            { name: 'occurred_at', type: 'text' },
            { name: 'annotation', type: 'text' },
            { name: 'learned', type: 'text', nullable: true },
            { name: 'remind_at', type: 'text', nullable: true },
            { name: 'remind_text', type: 'text', nullable: true },
            { name: 'remind_done_at', type: 'text', nullable: true },
            { name: 'author_id', type: 'text', nullable: true },
            { name: 'search_text', type: 'text' },
        ],
    },
    {
        name: 'journal_entry_audios',
        mirror: 'JournalEntryAudio',
        columns: [
            ...base,
            { name: 'church_id', type: 'text' },
            { name: 'entry_id', type: 'text' },
            { name: 'mime_type', type: 'text' },
            { name: 'size_bytes', type: 'int' },
            { name: 'duration_seconds', type: 'int', nullable: true },
            { name: 'recorded', type: 'bool', default: false },
            { name: 'storage_key', type: 'text' },
        ],
    },
];
