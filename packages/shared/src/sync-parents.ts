/**
 * De quién cuelga cada tabla hija (`scope: 'parent'` en `SYNC_COVERAGE`): el
 * registro de cambios resuelve la iglesia y el dueño de una fila subiendo por
 * esta cadena hasta una tabla con ámbito propio. `sync-parents.test.ts` de la
 * API comprueba que cada hija declara su padre y que la columna existe.
 */
export interface SyncParent {
    /** Columna de la hija que apunta al padre. */
    column: string;
    /** Tabla del padre. */
    table: string;
}

export const SYNC_PARENTS: Readonly<Record<string, SyncParent>> = {
    believer_tag_links: { column: 'believer_id', table: 'believers' },
    believer_ministries: { column: 'believer_id', table: 'believers' },
    believer_gifts: { column: 'believer_id', table: 'believers' },
    pattern_phases: { column: 'pattern_id', table: 'meeting_patterns' },
    meeting_slots: { column: 'meeting_id', table: 'meetings' },
    meeting_slot_believers: { column: 'slot_id', table: 'meeting_slots' },
    task_tags: { column: 'task_id', table: 'tasks' },
    task_occurrences: { column: 'task_id', table: 'tasks' },
    task_reminders: { column: 'task_id', table: 'tasks' },
    task_reminder_tags: { column: 'reminder_id', table: 'task_reminders' },
    dream_emotions: { column: 'dream_id', table: 'dreams' },
    dream_audios: { column: 'dream_id', table: 'dreams' },
    habit_tags: { column: 'habit_id', table: 'habits' },
    habit_occurrences: { column: 'habit_id', table: 'habits' },
    habit_reminders: { column: 'habit_id', table: 'habits' },
    habit_reminder_tags: { column: 'reminder_id', table: 'habit_reminders' },
    list_members: { column: 'list_id', table: 'lists' },
    list_grants: { column: 'list_id', table: 'lists' },
    list_views: { column: 'list_id', table: 'lists' },
    list_access_log: { column: 'list_id', table: 'lists' },
    custom_table_columns: { column: 'table_id', table: 'custom_tables' },
    custom_table_rows: { column: 'table_id', table: 'custom_tables' },
    custom_table_views: { column: 'table_id', table: 'custom_tables' },
};
