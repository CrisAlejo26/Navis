import {
    type CreatePatternInput,
    type MeetingPattern,
    type PatternPhase,
    type UpdatePatternInput,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';

/**
 * Las reuniones fijas de un calendario en **local** — la pareja de
 * `PatternsService` de la API, sobre SQLite del teléfono.
 *
 * De aquí no salen filas: el mes se pinta expandiendo los patrones al vuelo y
 * solo se materializa la reunión que alguien toca (D3).
 */

export type LocalPattern = Omit<MeetingPattern, 'churchId'>;

async function phasesOf(patternIds: readonly string[]): Promise<Map<string, PatternPhase[]>> {
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
     WHERE pattern_id IN (${placeholders}) ORDER BY position ASC`,
        ...unique,
    )) {
        grouped.set(row.pattern_id, [
            ...(grouped.get(row.pattern_id) ?? []),
            { id: row.id, name: row.name, position: row.position },
        ]);
    }
    return grouped;
}

export async function listPatterns(calendarId: string): Promise<LocalPattern[]> {
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
       FROM meeting_patterns WHERE calendar_id = ? AND deleted_at IS NULL
       ORDER BY congregation_id ASC, weekday ASC, start_time ASC`,
        calendarId,
    );
    const phases = await phasesOf(rows.map((row) => row.id));

    return rows.map((row) => ({
        ...row,
        isActive: row.isActive === 1,
        phases: phases.get(row.id) ?? [],
    }));
}

/** Crear, con su sede y sus fases en su orden (§7). */
export async function createPattern(
    churchId: string,
    calendarId: string,
    input: CreatePatternInput,
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    await db.withTransactionAsync(async () => {
        const repetido = await db.getFirstAsync<{ total: number }>(
            `SELECT COUNT(*) AS total FROM meeting_patterns
       WHERE church_id = ? AND calendar_id = ? AND congregation_id = ? AND weekday = ? AND start_time = ? AND deleted_at IS NULL`,
            churchId,
            calendarId,
            input.congregationId,
            input.weekday,
            input.startTime,
        );
        if ((repetido?.total ?? 0) > 0)
            throw new Error('Ya hay una reunión fija con esa sede, día y hora');

        const patternId = newId();
        const accent =
            input.accent ??
            (
                await db.getFirstAsync<{ accent: string }>(
                    'SELECT accent FROM congregations WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
                    churchId,
                    input.congregationId,
                )
            )?.accent ??
            'primary';

        await db.runAsync(
            `INSERT INTO meeting_patterns (id, created_at, updated_at, deleted_at, church_id, calendar_id, congregation_id, name, weekday, start_time, accent, is_active, valid_from, valid_to)
       VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
            patternId,
            now,
            now,
            churchId,
            calendarId,
            input.congregationId,
            input.name,
            input.weekday,
            input.startTime,
            accent,
            input.validFrom ?? null,
            input.validTo ?? null,
        );
        for (const [position, phase] of input.phases.entries()) {
            await db.runAsync(
                'INSERT INTO pattern_phases (id, created_at, updated_at, deleted_at, pattern_id, name, position) VALUES (?, ?, ?, NULL, ?, ?, ?)',
                newId(),
                now,
                now,
                patternId,
                phase.name,
                position,
            );
        }
    });
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
        const current = await db.getFirstAsync<{
            name: string;
            start_time: string;
            accent: string;
            is_active: number;
            valid_from: string | null;
            valid_to: string | null;
        }>(
            'SELECT name, start_time, accent, is_active, valid_from, valid_to FROM meeting_patterns WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
            churchId,
            input.id,
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
       WHERE id = ?`,
            name,
            startTime,
            accent,
            isActive,
            validFrom,
            validTo,
            nowIso(),
            input.id,
        );

        if (input.phases) {
            await db.runAsync('DELETE FROM pattern_phases WHERE pattern_id = ?', input.id);
            for (const [position, phase] of input.phases.entries()) {
                await db.runAsync(
                    'INSERT INTO pattern_phases (id, created_at, updated_at, deleted_at, pattern_id, name, position) VALUES (?, ?, ?, NULL, ?, ?, ?)',
                    newId(),
                    now,
                    now,
                    input.id,
                    phase.name,
                    position,
                );
            }
        }
    });

    void calendarId;
}

/** Borrado lógico; las reuniones ya creadas se quedan (§7). */
export async function deletePattern(patternId: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        'UPDATE meeting_patterns SET deleted_at = ?, updated_at = ? WHERE id = ?',
        nowIso(),
        nowIso(),
        patternId,
    );
}
