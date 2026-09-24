import { addDays, type CalendarSummary, type PreacherBalance } from '@navis/shared';

import { getDb } from '../db';

/**
 * El reparto del tramo en **local** — la pareja de `SummaryService` +
 * `calendar-warnings` de la API, sobre SQLite del teléfono.
 *
 * Solo mira reuniones **materializadas**: una propuesta que nadie ha tocado no
 * tiene a nadie asignado, y contarla como hueco sería inundar de avisos los
 * meses que todavía no se han programado.
 */

interface Assignment {
    believerId: string;
    name: string;
    date: string;
    congregationId: string;
    detail: string;
}

interface Gap {
    date: string;
    congregationId: string;
    detail: string;
}

/** Ordenado por quien más veces sube: es la lectura que se busca al abrirlo. */
function balance(assignments: readonly Assignment[]): PreacherBalance[] {
    const people = new Map<string, PreacherBalance>();

    for (const one of assignments) {
        const current = people.get(one.believerId);

        if (!current) {
            people.set(one.believerId, {
                believerId: one.believerId,
                name: one.name,
                times: 1,
                lastDate: one.date,
                congregationIds: [one.congregationId],
            });
            continue;
        }

        current.times += 1;
        if (!current.lastDate || one.date > current.lastDate) current.lastDate = one.date;
        if (!current.congregationIds.includes(one.congregationId)) {
            current.congregationIds.push(one.congregationId);
        }
    }

    return [...people.values()].sort((a, b) => b.times - a.times || a.name.localeCompare(b.name));
}

/**
 * Los avisos del tramo (§7.3): fase sin nadie, la misma persona dos veces el
 * mismo día, en días consecutivos o en dos sedes. Ninguno bloquea nada:
 * repetir a alguien dos días seguidos puede ser exactamente lo que se quiere.
 */
function repeatWarnings(assignments: readonly Assignment[]): CalendarSummary['warnings'] {
    const warnings: CalendarSummary['warnings'] = [];
    const byPerson = new Map<string, Assignment[]>();

    for (const assignment of assignments) {
        byPerson.set(assignment.believerId, [
            ...(byPerson.get(assignment.believerId) ?? []),
            assignment,
        ]);
    }

    for (const [believerId, list] of byPerson) {
        const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
        const name = sorted[0]?.name ?? '';
        const days = new Map<string, Assignment[]>();
        for (const one of sorted) days.set(one.date, [...(days.get(one.date) ?? []), one]);

        for (const [date, sameDay] of days) {
            if (sameDay.length < 2) continue;
            const venues = new Set(sameDay.map((one) => one.congregationId));

            warnings.push({
                // Dos sedes el mismo día es un caso distinto de dos fases seguidas:
                // la persona tiene que desplazarse, y eso se avisa aparte.
                kind: venues.size > 1 ? 'twoVenues' : 'twiceSameDay',
                date,
                believerId,
                believerName: name,
                congregationId: sameDay[0]?.congregationId ?? null,
                detail: sameDay.map((one) => one.detail).join(' · '),
            });
        }

        const uniqueDays = [...days.keys()].sort((a, b) => a.localeCompare(b));
        for (const [index, date] of uniqueDays.entries()) {
            const previous = uniqueDays[index - 1];
            if (!previous || addDays(previous, 1) !== date) continue;

            warnings.push({
                kind: 'backToBack',
                date,
                believerId,
                believerName: name,
                congregationId: days.get(date)?.[0]?.congregationId ?? null,
                detail: previous,
            });
        }
    }

    return warnings;
}

export async function calendarSummary(
    churchId: string,
    calendarId: string,
    from: string,
    to: string,
    congregationIds?: readonly string[],
): Promise<CalendarSummary> {
    const db = await getDb();
    const only = congregationIds?.length ? congregationIds : null;

    const meetings = (
        await db.getAllAsync<{
            id: string;
            congregation_id: string;
            date: string;
            name: string;
            status: string;
        }>(
            `SELECT id, congregation_id, date, name, status FROM meetings
       WHERE church_id = ? AND calendar_id = ? AND date >= ? AND date <= ? AND deleted_at IS NULL`,
            churchId,
            calendarId,
            from,
            to,
        )
    ).filter((meeting) => !only || only.includes(meeting.congregation_id));

    const names = new Map(
        (
            await db.getAllAsync<{ id: string; name: string }>(
                `SELECT id, TRIM(first_name || ' ' || last_name) AS name FROM believers
         WHERE church_id = ? AND deleted_at IS NULL`,
                churchId,
            )
        ).map((row) => [row.id, row.name]),
    );

    const assignments: Assignment[] = [];
    const gaps: Gap[] = [];

    for (const meeting of meetings) {
        if (meeting.status === 'cancelada') continue;

        for (const slot of await db.getAllAsync<{ name: string; believer_id: string | null }>(
            'SELECT name, believer_id FROM meeting_slots WHERE meeting_id = ? ORDER BY position ASC',
            meeting.id,
        )) {
            const detail = `${meeting.name} · ${slot.name}`;

            if (!slot.believer_id) {
                gaps.push({ date: meeting.date, congregationId: meeting.congregation_id, detail });
                continue;
            }

            assignments.push({
                believerId: slot.believer_id,
                name: names.get(slot.believer_id) ?? '—',
                date: meeting.date,
                congregationId: meeting.congregation_id,
                detail,
            });
        }
    }

    return {
        from,
        to,
        people: balance(assignments),
        warnings: [
            ...gaps.map((gap) => ({
                kind: 'unassigned' as const,
                date: gap.date,
                believerId: null,
                believerName: null,
                congregationId: gap.congregationId,
                detail: gap.detail,
            })),
            ...repeatWarnings(assignments),
        ],
    };
}
