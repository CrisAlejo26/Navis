import { ACCENT_PALETTE, SEEDED_CALENDARS, defaultWeekFor } from '@navis/shared';

import { assertInChurch } from '../church-scope';
import { newId, type LocalDb } from '../local-db';

/**
 * La siembra del **andamiaje de calendario** de una iglesia local: los cuatro
 * calendarios de serie (RFC 0002 D15) y la semana por defecto de cada pareja
 * calendario–sede (`defaultWeekFor`, RFC 0002 §5.7).
 *
 * Como WeekSeederService, no vuelve a sembrar calendarios existentes ni
 * patrones de una pareja calendario–sede que alguien ya pudo editar.
 *
 * Las migraciones y createChurch pasan la base en transacción; no usan la cola.
 */

export async function ensureCalendars(db: LocalDb, churchId: string, now: string): Promise<void> {
    const existing = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM calendars WHERE church_id = ? AND deleted_at IS NULL',
        churchId,
    );
    if ((existing?.total ?? 0) > 0) return;

    for (const [position, one] of SEEDED_CALENDARS.entries()) {
        await db.runAsync(
            'INSERT INTO calendars (id, created_at, updated_at, deleted_at, church_id, name, slug, ministry, position) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)',
            newId(),
            now,
            now,
            churchId,
            one.name,
            one.slug,
            one.ministry,
            position,
        );
    }
}

/** La semana de serie en cada calendario para la sede nueva (o al revés). */
export async function seedPatternFor(
    db: LocalDb,
    calendar: { id: string; ministry: string | null },
    congregation: { id: string; accent: string },
    churchId: string,
    now: string,
): Promise<void> {
    await assertInChurch(db, 'calendars', calendar.id, churchId);
    await assertInChurch(db, 'congregations', congregation.id, churchId);
    const yaTiene = await db.getFirstAsync<{ total: number }>(
        'SELECT COUNT(*) AS total FROM meeting_patterns WHERE church_id = ? AND calendar_id = ? AND congregation_id = ? AND deleted_at IS NULL',
        churchId,
        calendar.id,
        congregation.id,
    );
    if ((yaTiene?.total ?? 0) > 0) return;

    const week = defaultWeekFor(calendar.ministry);
    for (const reunion of week) {
        const patternId = newId();
        await db.runAsync(
            'INSERT INTO meeting_patterns (id, created_at, updated_at, deleted_at, church_id, calendar_id, congregation_id, name, weekday, start_time, accent, is_active, valid_from, valid_to) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, 1, NULL, NULL)',
            patternId,
            now,
            now,
            churchId,
            calendar.id,
            congregation.id,
            reunion.name,
            reunion.weekday,
            reunion.startTime,
            congregation.accent ?? 'primary',
        );
        for (const [position, name] of reunion.phases.entries()) {
            await db.runAsync(
                'INSERT INTO pattern_phases (id, created_at, updated_at, deleted_at, pattern_id, name, position) SELECT ?, ?, ?, NULL, ?, ?, ? WHERE EXISTS (SELECT id FROM meeting_patterns WHERE id = ? AND church_id = ? AND deleted_at IS NULL)',
                newId(),
                now,
                now,
                patternId,
                name,
                position,
                patternId,
                churchId,
            );
        }
    }
}

/**
 * El andamiaje completo: calendarios de serie si no hay ninguno, y la semana
 * de cada calendario en **cada sede activa**. Es lo que llama la migración y
 * `createChurch`.
 */
export async function seedCalendarScaffold(
    db: LocalDb,
    churchId: string,
    now: string,
): Promise<void> {
    await ensureCalendars(db, churchId, now);

    const calendars = await db.getAllAsync<{ id: string; ministry: string | null }>(
        'SELECT id, ministry FROM calendars WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC',
        churchId,
    );
    const congregations = await db.getAllAsync<{ id: string; accent: string }>(
        'SELECT id, accent FROM congregations WHERE church_id = ? AND is_active = 1 AND deleted_at IS NULL ORDER BY position ASC',
        churchId,
    );

    for (const calendar of calendars) {
        for (const congregation of congregations) {
            await seedPatternFor(db, calendar, congregation, churchId, now);
        }
    }
}

/** El color de la paleta que toca en la posición dada — el reparto de la API. */
export function accentAt(position: number): string {
    return ACCENT_PALETTE[position % ACCENT_PALETTE.length];
}
