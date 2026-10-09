/**
 * Qué significa cada columna de texto que no es texto de verdad. Es la
 * diferencia entre «fecha sin hora», «instante UTC» y «hora del día» que el plan
 * de sincronización (Fase 2) exige no confundir: un `YYYY-MM-DD` no es un
 * instante, y tratarlo como tal lo corre un día en los husos al oeste.
 *
 * Las columnas que no aparecen son texto, número o booleano sin más. Las de
 * `BaseEntity` (`created_at`, `updated_at`, `deleted_at`) son siempre instantes
 * y no se repiten aquí. `sync-column-kinds.test.ts` de la API compara esta tabla
 * con los tipos de las entidades de TypeORM.
 */
export type ColumnKind = 'instant' | 'day' | 'time' | 'json';

const day = 'day';
const instant = 'instant';
const time = 'time';
const json = 'json';

export const LOCAL_COLUMN_KINDS: Record<string, Record<string, ColumnKind>> = {
    roles: { permissions: json },
    believers: { last_note_at: day, arrived_at: day },
    believer_ministries: { started_at: day },
    believer_gifts: { received_at: day },
    believer_notes: { occurred_at: day, remind_at: instant, remind_done_at: instant },
    meeting_patterns: { start_time: time, valid_from: day, valid_to: day },
    meetings: { date: day, start_time: time },
    prophecies: { received_at: day, fulfilled_at: day, last_fulfillment_at: day },
    prophecy_fulfillments: { occurred_at: day },
    dreams: { dreamed_at: day, fulfilled_at: day },
    journal_entries: { occurred_at: day, remind_at: instant, remind_done_at: instant },
    lists: { shared_at: instant, share_expires_at: instant },
    list_members: { added_at: instant },
    list_viewers: { expires_at: instant, sessions_valid_from: instant, last_seen_at: instant },
    list_grants: { granted_at: instant },
    list_views: { viewed_at: instant },
    list_access_log: { at: instant },
    task_time_entries: { started_at: instant, ended_at: instant },
    tasks: {
        date: day,
        time,
        completed_at: instant,
        repeat_end_date: day,
        repeat_options: json,
        repeat_pauses: json,
        repeat_stopped_at: day,
        due_date: day,
        in_progress_deadline: instant,
    },
    task_occurrences: { date: day, completed_at: instant },
    task_reminders: { remind_at: instant },
    habits: { date: day, time, completed_at: instant },
    habit_occurrences: { date: day, completed_at: instant },
    habit_reminders: { remind_at: instant },
    teachings: { received_at: day },
};

const BASE_INSTANTS = ['created_at', 'updated_at', 'deleted_at'];

/** El tipo de una columna, incluidas las comunes de `BaseEntity`; `undefined` si es texto/número/booleano. */
export function columnKind(table: string, column: string): ColumnKind | undefined {
    if (BASE_INSTANTS.includes(column)) return 'instant';
    return LOCAL_COLUMN_KINDS[table]?.[column];
}
