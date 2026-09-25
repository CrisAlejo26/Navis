import {
    isBelieverStatus,
    isSchedulable,
    type AssignSlotInput,
    type CreateMeetingInput,
    type UpdateMeetingInput,
    type SetMeetingSlotsInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';

/**
 * Asignar es la primitiva (D4) y el CRUD de reuniones — la pareja de
 * `AssignmentsService` + `MeetingsService` de la API, sobre SQLite del
 * teléfono (docs/planes/implementados/calendario-movil-plan.md §4.3).
 *
 * Todo pasa por la cola de `db.ts` (la trampa de Android) y las escrituras
 * van dentro de `withTransactionAsync`.
 */

/**
 * Poner a alguien en una fase: si la reunión de ese día todavía era una
 * propuesta del patrón, se materializa —reunión y fases— antes de escribir.
 * Idempotente: repetir la misma llamada deja el mismo estado, y el índice
 * único parcial `(pattern_id, date)` impide que dos clics creen dos reuniones.
 */
export async function assignSlot(churchId: string, input: AssignSlotInput): Promise<void> {
    const db = await getDb();

    if (input.believerId) {
        const person = await db.getFirstAsync<{ status: string }>(
            'SELECT status FROM believers WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
            churchId,
            input.believerId,
        );
        if (!person) throw new Error('Esa persona no existe en esta iglesia');
        if (!isBelieverStatus(person.status) || !isSchedulable(person.status)) {
            throw new Error('Esa persona ya no está activa');
        }
    }

    await db.withTransactionAsync(async () => {
        let meetingId = input.meetingId ?? null;

        if (!meetingId && input.patternId) {
            const found = await db.getFirstAsync<{ id: string }>(
                'SELECT id FROM meetings WHERE church_id = ? AND pattern_id = ? AND date = ? AND deleted_at IS NULL',
                churchId,
                input.patternId,
                input.date,
            );
            meetingId = found?.id ?? null;

            if (!meetingId) {
                const pattern = await db.getFirstAsync<{
                    calendar_id: string;
                    congregation_id: string;
                    name: string;
                    start_time: string;
                    accent: string;
                }>(
                    'SELECT calendar_id, congregation_id, name, start_time, accent FROM meeting_patterns WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
                    churchId,
                    input.patternId,
                );
                if (!pattern) throw new Error('Ese patrón no existe en esta iglesia');

                meetingId = newId();
                await db.runAsync(
                    'INSERT INTO meetings (id, created_at, updated_at, deleted_at, church_id, calendar_id, congregation_id, pattern_id, date, start_time, name, accent, status, notes) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)',
                    meetingId,
                    nowIso(),
                    nowIso(),
                    churchId,
                    pattern.calendar_id,
                    pattern.congregation_id,
                    input.patternId,
                    input.date,
                    pattern.start_time,
                    pattern.name,
                    pattern.accent,
                    'programada',
                );
                // Las fases del patrón se copian en su orden: la reunión es dueña de
                // la suya a partir de ahora y el patrón ya no la toca (D6, D7).
                const phases = await db.getAllAsync<{ name: string; position: number }>(
                    'SELECT name, position FROM pattern_phases WHERE pattern_id = ? ORDER BY position ASC',
                    input.patternId,
                );
                for (const phase of phases) {
                    await db.runAsync(
                        'INSERT INTO meeting_slots (id, created_at, updated_at, deleted_at, meeting_id, name, position, believer_id, note) VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, NULL)',
                        newId(),
                        nowIso(),
                        nowIso(),
                        meetingId,
                        phase.name,
                        phase.position,
                    );
                }
            }
        }

        if (!meetingId) throw new Error('Hace falta la reunión o el patrón');

        const slot = await db.getFirstAsync<{ id: string; note: string | null }>(
            'SELECT id, note FROM meeting_slots WHERE meeting_id = ? AND position = ?',
            meetingId,
            input.position,
        );
        if (!slot) throw new Error('Esa fase no existe en la reunión');

        await db.runAsync(
            'UPDATE meeting_slots SET believer_id = ?, note = ?, updated_at = ? WHERE id = ?',
            input.believerId,
            input.note !== undefined ? (input.note ?? null) : slot.note,
            nowIso(),
            slot.id,
        );
    });
}

/** Una reunión puntual: la que no nace de ningún patrón. */
export async function createMeeting(
    churchId: string,
    calendarId: string,
    input: CreateMeetingInput,
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    await db.withTransactionAsync(async () => {
        const sede = await db.getFirstAsync<{ accent: string }>(
            'SELECT accent FROM congregations WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
            churchId,
            input.congregationId,
        );
        if (!sede) throw new Error('Esa sede no existe en esta iglesia');

        const meetingId = newId();
        await db.runAsync(
            'INSERT INTO meetings (id, created_at, updated_at, deleted_at, church_id, calendar_id, congregation_id, pattern_id, date, start_time, name, accent, status, notes) VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL)',
            meetingId,
            now,
            now,
            churchId,
            calendarId,
            input.congregationId,
            input.date,
            input.startTime,
            input.name,
            sede.accent,
            'programada',
        );
        for (const [position, phase] of input.phases.entries()) {
            await db.runAsync(
                'INSERT INTO meeting_slots (id, created_at, updated_at, deleted_at, meeting_id, name, position, believer_id, note) VALUES (?, ?, ?, NULL, ?, ?, ?, NULL, NULL)',
                newId(),
                now,
                now,
                meetingId,
                phase.name,
                position,
            );
        }
    });
}

/** Hora, nombre, notas, sede o `status: cancelada` (§7). */
export async function updateMeeting(
    churchId: string,
    input: UpdateMeetingInput & { id: string },
): Promise<void> {
    const db = await getDb();

    await db.withTransactionAsync(async () => {
        const current = await db.getFirstAsync<{
            name: string;
            start_time: string;
            notes: string | null;
            status: string;
            congregation_id: string;
            accent: string;
        }>(
            'SELECT name, start_time, notes, status, congregation_id, accent FROM meetings WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
            churchId,
            input.id,
        );
        if (!current) throw new Error('Esa reunión no existe en esta iglesia');

        if (
            input.congregationId !== undefined &&
            input.congregationId !== current.congregation_id
        ) {
            const sede = await db.getFirstAsync<{ accent: string }>(
                'SELECT accent FROM congregations WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
                churchId,
                input.congregationId,
            );
            if (!sede) throw new Error('Esa sede no existe en esta iglesia');
            await db.runAsync(
                'UPDATE meetings SET congregation_id = ?, accent = ? WHERE id = ?',
                input.congregationId,
                sede.accent,
                input.id,
            );
        }

        await db.runAsync(
            'UPDATE meetings SET name = ?, start_time = ?, notes = ?, status = ?, updated_at = ? WHERE id = ?',
            input.name !== undefined ? input.name : current.name,
            input.startTime !== undefined ? input.startTime : current.start_time,
            input.notes !== undefined ? (input.notes ?? null) : current.notes,
            input.status !== undefined ? input.status : current.status,
            nowIso(),
            input.id,
        );
    });
}

/** Borrado lógico; si nació de un patrón, el día vuelve a propuesta (§7). */
export async function deleteMeeting(meetingId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'UPDATE meetings SET deleted_at = ?, updated_at = ? WHERE id = ?',
        nowIso(),
        nowIso(),
        meetingId,
    );
}

/** Reemplaza la lista de fases entera: añadir, quitar y reordenar es una sola acción. */
export async function setMeetingSlots(
    churchId: string,
    input: SetMeetingSlotsInput & { id: string },
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    await db.withTransactionAsync(async () => {
        const meeting = await db.getFirstAsync<{ id: string }>(
            'SELECT id FROM meetings WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
            churchId,
            input.id,
        );
        if (!meeting) throw new Error('Esa reunión no existe en esta iglesia');

        await db.runAsync('DELETE FROM meeting_slots WHERE meeting_id = ?', input.id);
        for (const [position, slot] of input.slots.entries()) {
            await db.runAsync(
                'INSERT INTO meeting_slots (id, created_at, updated_at, deleted_at, meeting_id, name, position, believer_id, note) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)',
                newId(),
                now,
                now,
                input.id,
                slot.name,
                position,
                slot.believerId ?? null,
                slot.note ?? null,
            );
        }
    });
}
