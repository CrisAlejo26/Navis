import type { BelieverStatus } from '@navis/shared';

/**
 * El SQL que comparten el listado y el panel: cómo se cuenta el margen de una
 * persona sobre SQLite. Es la traducción literal de `daysSince` de la API —
 * `julianday(date(...))` con el `date()` puesto, o la resta incluye la hora y
 * deja de ser un número entero de días (CLAUDE.md).
 */

/** Días de calendario hasta hoy, desde la última nota o, sin ninguna, del alta. */
export const DAYS_SINCE = `CAST(julianday(date(?)) - julianday(date(COALESCE(substr(last_note_at, 1, 10), substr(created_at, 1, 10)))) AS INTEGER)`;

/** Si esa persona ha agotado su margen (D3): aviso encendido y días pasado. */
export const NEEDS_ATTENTION = `alert_after_days IS NOT NULL AND ${DAYS_SINCE} > alert_after_days`;

const BELIEVER_COLUMNS = [
    'id',
    'church_id',
    'congregation_id',
    'first_name',
    'last_name',
    'phone',
    'email',
    'status',
    'alert_after_days',
    'last_note_at',
    'arrived_at',
    'arrival_site',
    'bible_readings',
    'vivencias_readings',
    'bible_institute_times',
    'user_id',
    'photo_key',
    'featured_tag_id',
    'created_at',
];

/** Las columnas de `believers`, con el prefijo de tabla que pida cada consulta. */
export function believerColumns(alias: string | null = null): string {
    return BELIEVER_COLUMNS.map((column) => (alias ? `${alias}.${column}` : column)).join(', ');
}

export interface BelieverRow {
    id: string;
    church_id: string;
    congregation_id: string | null;
    first_name: string;
    last_name: string | null;
    phone: string | null;
    email: string | null;
    status: string;
    alert_after_days: number | null;
    last_note_at: string | null;
    arrived_at: string | null;
    arrival_site: string | null;
    bible_readings: number | null;
    vivencias_readings: number | null;
    bible_institute_times: number | null;
    user_id: string | null;
    photo_key: string | null;
    featured_tag_id: string | null;
    created_at: string;
}

/** El día de hoy en la zona del dispositivo, como `todayIso` del panel. */
export function deviceToday(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
}

/** Los estados que filtran el listado, ya validados: lo que no es estado, no entra. */
export function filterStatuses(values: readonly string[] | undefined): BelieverStatus[] {
    const known: BelieverStatus[] = ['activo', 'nuevo', 'inactivo', 'trasladado'];
    return (values ?? []).filter((value): value is BelieverStatus =>
        known.includes(value as BelieverStatus),
    );
}
