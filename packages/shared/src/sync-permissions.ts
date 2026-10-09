import { hasPermission, type Permission } from './permissions';
import { SYNC_COVERAGE } from './sync-coverage';

/**
 * Qué permiso de rol hace falta para **leer** cada tabla por la vía de la
 * sincronización: el mismo que exige la pantalla equivalente de la web. `null`
 * es «sin permiso de rol»: los datos de cada persona (los protege el dueño) y lo
 * que cualquier miembro necesita para funcionar (su iglesia, el catálogo de
 * roles). Sin esto el registro entregaría a un rol sin `believers.view` las
 * fichas de los creyentes que la web le niega.
 */
export const SYNC_READ_PERMISSION: Readonly<Record<string, Permission | null>> = {
    churches: null,
    roles: null,
    church_members: 'users.view',
    // Creyentes y sus catálogos
    believers: 'believers.view',
    believer_ministries: 'believers.view',
    believer_gifts: 'believers.view',
    believer_tags: 'believers.view',
    believer_tag_links: 'believers.view',
    believer_notes: 'believers.view',
    note_audios: 'believers.view',
    ministries: 'believers.view',
    gifts: 'believers.view',
    // Calendario
    calendars: 'calendar.view',
    congregations: 'calendar.view',
    meeting_patterns: 'calendar.view',
    pattern_phases: 'calendar.view',
    meetings: 'calendar.view',
    meeting_slots: 'calendar.view',
    meeting_slot_believers: 'calendar.view',
    // Datos de cada persona: los protege el dueño, no un permiso de rol
    prophecies: null,
    prophecy_fulfillments: null,
    dreams: null,
    emotions: null,
    dream_emotions: null,
    dream_audios: null,
    teachings: null,
    // Cuaderno de la iglesia
    journal_entries: 'journal.view',
    journal_entry_audios: 'journal.view',
    // Listas: quién tiene la llave es más sensible que la lista misma
    lists: 'lists.view',
    list_members: 'lists.view',
    list_views: 'lists.view',
    list_viewers: 'lists.share',
    list_grants: 'lists.share',
    list_access_log: 'lists.share',
    // Tareas y hábitos
    tags: 'tasks.view',
    workflows: 'tasks.view',
    tasks: 'tasks.view',
    task_tags: 'tasks.view',
    task_occurrences: 'tasks.view',
    task_reminders: 'tasks.view',
    task_reminder_tags: 'tasks.view',
    task_time_entries: 'tasks.view',
    task_streak_cache: 'tasks.view',
    habits: 'tasks.view',
    habit_tags: 'tasks.view',
    habit_occurrences: 'tasks.view',
    habit_reminders: 'tasks.view',
    habit_reminder_tags: 'tasks.view',
    // Tablas personalizadas
    custom_tables: 'tables.view',
    custom_table_columns: 'tables.view',
    custom_table_rows: 'tables.view',
    custom_table_views: 'tables.view',
};

/** Las tablas sincronizadas que **no** puede leer quien tiene estos permisos. */
export function deniedSyncTables(granted: readonly string[]): string[] {
    return Object.entries(SYNC_COVERAGE)
        .filter(([, entry]) => entry.policy === 'synced')
        .map(([table]) => table)
        .filter((table) => {
            const required = SYNC_READ_PERMISSION[table];
            return required !== null && required !== undefined && !hasPermission(granted, required);
        });
}
