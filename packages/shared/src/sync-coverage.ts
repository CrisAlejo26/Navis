/**
 * Matriz de cobertura de la sincronización (Fase 2 del plan): qué pasa con
 * **cada tabla** de la API. Una entidad nueva tiene que declarar su política
 * aquí o `sync-coverage.test.ts` de la API falla: así ningún módulo queda fuera
 * de la sincronización por olvido.
 *
 * - `synced`: tiene espejo en SQLite del móvil y viaja en los dos sentidos.
 * - `pending-mobile`: pertenece al negocio, pero el móvil aún no tiene su tabla
 *   local; es trabajo pendiente, no una excepción al alcance.
 * - `cache`: se regenera; no es una modificación del usuario y no se replica.
 * - `server-only`: infraestructura del servidor (credenciales, dispositivos).
 */
export type SyncPolicy = 'synced' | 'pending-mobile' | 'cache' | 'server-only';

/** Quién puede leer el registro: base del filtro de permisos en el servidor. */
export type SyncScope = 'church' | 'owner' | 'parent' | 'account' | 'system';

export interface SyncCoverageEntry {
    policy: SyncPolicy;
    scope: SyncScope;
}

const synced = (scope: SyncScope): SyncCoverageEntry => ({ policy: 'synced', scope });
const pending = (scope: SyncScope): SyncCoverageEntry => ({ policy: 'pending-mobile', scope });

export const SYNC_COVERAGE: Record<string, SyncCoverageEntry> = {
    // Iglesias y personas
    churches: synced('owner'),
    church_members: synced('church'),
    roles: synced('system'),
    profiles: pending('account'),
    // Creyentes
    believers: synced('church'),
    believer_ministries: synced('parent'),
    gifts: synced('church'),
    believer_gifts: synced('parent'),
    believer_tags: synced('church'),
    believer_tag_links: synced('parent'),
    believer_notes: synced('church'),
    note_audios: synced('church'),
    ministries: synced('church'),
    // Calendario
    calendars: synced('church'),
    congregations: synced('church'),
    meeting_patterns: synced('church'),
    pattern_phases: synced('parent'),
    meetings: synced('church'),
    meeting_slots: synced('parent'),
    meeting_slot_believers: synced('parent'),
    holiday_cache: { policy: 'cache', scope: 'system' },
    // Contenido personal
    prophecies: synced('owner'),
    prophecy_fulfillments: synced('owner'),
    dreams: synced('owner'),
    emotions: synced('owner'),
    dream_emotions: synced('parent'),
    dream_audios: synced('parent'),
    teachings: synced('owner'),
    journal_entries: synced('church'),
    journal_entry_audios: synced('church'),
    // Listas
    lists: synced('church'),
    list_members: synced('parent'),
    list_viewers: synced('church'),
    list_grants: synced('parent'),
    list_views: synced('parent'),
    list_access_log: synced('parent'),
    // Tareas y hábitos
    tags: synced('church'),
    workflows: synced('church'),
    tasks: synced('church'),
    task_tags: synced('parent'),
    task_occurrences: synced('parent'),
    task_reminders: synced('parent'),
    task_reminder_tags: synced('parent'),
    task_time_entries: synced('church'),
    task_streak_cache: synced('church'),
    habits: synced('church'),
    habit_tags: synced('parent'),
    habit_occurrences: synced('parent'),
    habit_reminders: synced('parent'),
    habit_reminder_tags: synced('parent'),
    // Tablas personalizadas
    custom_tables: synced('church'),
    custom_table_columns: synced('parent'),
    custom_table_rows: synced('parent'),
    custom_table_views: synced('parent'),
    // Comunicaciones: el móvil todavía no tiene el módulo
    channels: pending('church'),
    channel_members: pending('parent'),
    messages: pending('parent'),
    message_attachments: pending('parent'),
    message_reactions: pending('parent'),
    // Infraestructura del servidor
    devices: { policy: 'server-only', scope: 'account' },
    device_links: { policy: 'server-only', scope: 'account' },
};
