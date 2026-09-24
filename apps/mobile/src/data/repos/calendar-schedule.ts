import { eachDay, weekdayOf, MAX_CALENDAR_RANGE_DAYS, type CalendarRange } from '@navis/shared';

import { getDb } from '../db';
import { byTimeThenCongregation, toHm, slotView } from './calendar-format';

/**
 * La programación de un tramo en **local** — la pareja de `ScheduleService`
 * de la API, sobre SQLite del teléfono (docs/calendario-movil-plan.md §4.3).
 *
 * El mes se pinta expandiendo los patrones al vuelo; en la base solo hay fila
 * cuando alguien asigna (D3). Una propuesta se distingue por su `id` nulo, y
 * el cliente no tiene que saber nada más.
 */

type SlotRow = {
    id: string;
    name: string;
    position: number;
    believer_id: string | null;
    note: string | null;
};

/** Un patrón se propone ese día si es su día de la semana y está vigente. */
function appliesOn(
    pattern: { weekday: number; valid_from: string | null; valid_to: string | null },
    date: string,
): boolean {
    if (pattern.weekday !== weekdayOf(date)) return false;
    if (pattern.valid_from && date < pattern.valid_from) return false;
    if (pattern.valid_to && date > pattern.valid_to) return false;
    return true;
}

/** El tramo de un calendario: días con sus reuniones, reales o propuestas. */
export async function calendarRange(
    churchId: string,
    calendarId: string,
    from: string,
    to: string,
    congregationIds?: readonly string[],
): Promise<CalendarRange> {
    const total = eachDay(from, to).length;
    if (total <= 0) throw new Error('El rango de fechas está del revés');
    if (total > MAX_CALENDAR_RANGE_DAYS) throw new Error('El rango no puede pasar de 92 días');

    const db = await getDb();
    const only = congregationIds?.length ? new Set(congregationIds) : null;

    const congregations = await db.getAllAsync<{
        id: string;
        churchId: string;
        name: string;
        city: string | null;
        accent: string;
        position: number;
        isDefault: number;
        isActive: number;
    }>(
        'SELECT id, church_id AS churchId, name, city, accent, position, is_default AS isDefault, is_active AS isActive FROM congregations WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC',
        churchId,
    );
    const order = new Map(congregations.map((one) => [one.id, one.position]));
    const active = new Set(congregations.filter((one) => one.isActive === 1).map((one) => one.id));

    const names = new Map(
        (
            await db.getAllAsync<{ id: string; name: string }>(
                `SELECT id, TRIM(first_name || ' ' || last_name) AS name FROM believers
         WHERE church_id = ? AND deleted_at IS NULL`,
                churchId,
            )
        ).map((row) => [row.id, row.name]),
    );

    const patterns = (
        await db.getAllAsync<{
            id: string;
            congregation_id: string;
            name: string;
            weekday: number;
            start_time: string;
            accent: string;
            valid_from: string | null;
            valid_to: string | null;
        }>(
            'SELECT id, congregation_id, name, weekday, start_time, accent, valid_from, valid_to FROM meeting_patterns WHERE church_id = ? AND calendar_id = ? AND is_active = 1 AND deleted_at IS NULL',
            churchId,
            calendarId,
        )
    ).filter(
        (pattern) =>
            active.has(pattern.congregation_id) && (!only || only.has(pattern.congregation_id)),
    );

    const phasesByPattern = new Map<string, SlotRow[]>();
    for (const phase of await db.getAllAsync<{
        pattern_id: string;
        name: string;
        position: number;
    }>(
        `SELECT pp.pattern_id, pp.name, pp.position FROM pattern_phases pp
     JOIN meeting_patterns mp ON mp.id = pp.pattern_id
     WHERE mp.church_id = ? AND mp.calendar_id = ? AND mp.is_active = 1 AND mp.deleted_at IS NULL
     ORDER BY pp.position ASC`,
        churchId,
        calendarId,
    )) {
        phasesByPattern.set(phase.pattern_id, [
            ...(phasesByPattern.get(phase.pattern_id) ?? []),
            { id: '', name: phase.name, position: phase.position, believer_id: null, note: null },
        ]);
    }

    // Las reuniones del tramo y sus fases: primero la tabla, después los slots
    // de la página — la trampa de `take`/`skip` con relaciones, resuelta a mano.
    const meetings = await db.getAllAsync<{
        id: string;
        congregation_id: string;
        pattern_id: string | null;
        date: string;
        start_time: string;
        name: string;
        accent: string;
        status: string;
        notes: string | null;
    }>(
        'SELECT id, congregation_id, pattern_id, date, start_time, name, accent, status, notes FROM meetings WHERE church_id = ? AND calendar_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL ORDER BY date ASC, start_time ASC',
        churchId,
        calendarId,
        from,
        to,
    );
    const slotsByMeeting = new Map<string, SlotRow[]>();
    for (const meeting of meetings) {
        slotsByMeeting.set(
            meeting.id,
            await db.getAllAsync<SlotRow>(
                'SELECT id, name, position, believer_id, note FROM meeting_slots WHERE meeting_id = ? ORDER BY position ASC',
                meeting.id,
            ),
        );
    }

    const byDay = new Map<
        string,
        {
            id: string;
            congregationId: string;
            patternId: string | null;
            name: string;
            startTime: string;
            accent: string;
            status: 'programada' | 'cancelada';
            notes: string | null;
            slots: SlotRow[];
        }[]
    >();
    for (const meeting of meetings) {
        const one = {
            id: meeting.id,
            congregationId: meeting.congregation_id,
            patternId: meeting.pattern_id,
            name: meeting.name,
            startTime: toHm(meeting.start_time),
            accent: meeting.accent,
            status: meeting.status as 'programada' | 'cancelada',
            notes: meeting.notes,
            slots: slotsByMeeting.get(meeting.id) ?? [],
        };
        byDay.set(meeting.date, [...(byDay.get(meeting.date) ?? []), one]);
    }

    const sort = byTimeThenCongregation(order);

    return {
        from,
        to,
        congregations: congregations.map((one) => ({
            ...one,
            isDefault: one.isDefault === 1,
            isActive: one.isActive === 1,
        })),
        days: eachDay(from, to).map((date) => {
            const real = byDay.get(date) ?? [];
            const taken = new Set(real.map((one) => one.patternId));

            const proposed = patterns
                .filter((pattern) => appliesOn(pattern, date) && !taken.has(pattern.id))
                .map((pattern) => ({
                    id: null,
                    congregationId: pattern.congregation_id,
                    patternId: pattern.id,
                    name: pattern.name,
                    startTime: toHm(pattern.start_time),
                    accent: pattern.accent,
                    status: 'programada' as const,
                    notes: null,
                    slots: (phasesByPattern.get(pattern.id) ?? []).map((phase) => ({
                        id: null,
                        name: phase.name,
                        position: phase.position,
                        note: null,
                        believer: null,
                    })),
                }));

            return {
                date,
                meetings: [
                    ...real.map((one) => ({
                        ...one,
                        slots: one.slots.map((slot) => slotView(slot, names)),
                    })),
                    ...proposed,
                ].sort(sort),
                holiday: null,
            };
        }),
    };
}
