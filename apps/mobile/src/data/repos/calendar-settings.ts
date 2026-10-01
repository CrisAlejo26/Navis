import { type MeetingPattern, type PatternPhase, type UpdatePatternInput } from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { assertInChurch } from '../church-scope';
export { createPattern } from './calendar-pattern-create';

/**
 * Las reuniones fijas de un calendario en **local** — la pareja de
 * `PatternsService` de la API, sobre SQLite del teléfono.
 *
 * De aquí no salen filas: el mes se pinta expandiendo los patrones al vuelo y
 * solo se materializa la reunión que alguien toca (D3).
 */

export type LocalPattern = Omit<MeetingPattern, 'churchId'>;

async function phasesOf(
    patternIds: readonly string[],
    churchId: string,
): Promise<Map<string, PatternPhase[]>> {
    const unique = [...new Set(patternIds)].filter(Boolean);
    const grouped = new Map<string, PatternPhase[]>();
    if (unique.length === 0) return grouped;

    const placeholders = unique.map(() => '?').join(', ');
    const db = await getDb();
    for (const row of await db.getAllAsync<{
        id: string;
        pattern_id: string;
        name: string;
        position: number;
    }>(
        `SELECT id, pattern_id, name, position FROM pattern_phases
     WHERE pattern_id IN (${placeholders}) AND pattern_phases.pattern_id IN (SELECT id FROM meeting_patterns WHERE church_id = ? AND deleted_at IS NULL) ORDER BY position ASC`,
        ...unique,
        churchId,
    )) {
        grouped.set(row.pattern_id, [
            ...(grouped.get(row.pattern_id) ?? []),
            { id: row.id, name: row.name, position: row.position },
        ]);
    }
    return grouped;
}

export async function listPatterns(calendarId: string, churchId: string): Promise<LocalPattern[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<{
        id: string;
        churchId: string;
        congregationId: string;
        name: string;
        weekday: number;
        startTime: string;
        accent: string;
        isActive: number;
        validFrom: string | null;
        validTo: string | null;
    }>(
        `SELECT id, church_id AS churchId, congregation_id AS congregationId, name, weekday,
            start_time AS startTime, accent, is_active AS isActive,
            valid_from AS validFrom, valid_to AS validTo
       FROM meeting_patterns WHERE calendar_id = ? AND deleted_at IS NULL AND meeting_patterns.church_id = ? ORDER BY congregation_id ASC, weekday ASC, start_time ASC`,
        calendarId,
        churchId,
    );
    const phases = await phasesOf(
        rows.map((row) => row.id),
        churchId,
    );

    return rows.map((row) => ({
        ...row,
        isActive: row.isActive === 1,
        phases: phases.get(row.id) ?? [],
    }));
}

/**
 * Editar (D7: no reescribe lo ya materializado — una reunión materializada es
 * una decisión que alguien tomó; el patrón nuevo se aplica de ahí en adelante
 * a lo que siga siendo propuesta). Cambiar las fases reemplaza la lista.
 */
export async function updatePattern(
    churchId: string,
    calendarId: string,
    input: UpdatePatternInput & { id: string },
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    await db.withTransactionAsync(async () => {
        await assertInChurch(db, 'calendars', calendarId, churchId);
        const current = await db.getFirstAsync<{
            name: string;
            start_time: string;
            accent: string;
            is_active: number;
            valid_from: string | null;
            valid_to: string | null;
        }>(
            'SELECT name, start_time, accent, is_active, valid_from, valid_to FROM meeting_patterns WHERE church_id = ? AND id = ? AND calendar_id = ? AND deleted_at IS NULL',
            churchId,
            input.id,
            calendarId,
        );
        if (!current) throw new Error('Ese patrón no existe en esta iglesia');

        const name = input.name !== undefined ? input.name : current.name;
        const startTime = input.startTime !== undefined ? input.startTime : current.start_time;
        const accent = input.accent !== undefined ? input.accent : current.accent;
        const isActive =
            input.isActive !== undefined ? (input.isActive ? 1 : 0) : current.is_active;
        const validFrom =
            input.validFrom !== undefined ? (input.validFrom ?? null) : current.valid_from;
        const validTo = input.validTo !== undefined ? (input.validTo ?? null) : current.valid_to;

        await db.runAsync(
            `UPDATE meeting_patterns SET name = ?, start_time = ?, accent = ?, is_active = ?, valid_from = ?, valid_to = ?, updated_at = ?
       WHERE id = ? AND meeting_patterns.church_id = ? `,
            name,
            startTime,
            accent,
            isActive,
            validFrom,
            validTo,
            nowIso(),
            input.id,
            churchId,
        );

        if (input.phases) {
            await db.runAsync(
                'DELETE FROM pattern_phases WHERE pattern_id = ? AND pattern_phases.pattern_id IN (SELECT id FROM meeting_patterns WHERE church_id = ? AND deleted_at IS NULL) ',
                input.id,
                churchId,
            );
            for (const [position, phase] of input.phases.entries()) {
                await db.runAsync(
                    'INSERT INTO pattern_phases (id, created_at, updated_at, deleted_at, pattern_id, name, position) SELECT ?, ?, ?, NULL, ?, ?, ? WHERE EXISTS (SELECT id FROM meeting_patterns WHERE id = ? AND church_id = ? AND deleted_at IS NULL)',
                    newId(),
                    now,
                    now,
                    input.id,
                    phase.name,
                    position,
                    input.id,
                    churchId,
                );
            }
        }
    });
}

/** Borrado lógico; las reuniones ya creadas se quedan (§7). */
export async function deletePattern(patternId: string, churchId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'UPDATE meeting_patterns SET deleted_at = ?, updated_at = ? WHERE id = ? AND meeting_patterns.church_id = ? ',
        nowIso(),
        nowIso(),
        patternId,
        churchId,
    );
}
