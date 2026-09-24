import {
    DEFAULT_CONGREGATION_ACCENT,
    toSlug,
    type Congregation,
    type Calendar,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { seedPatternFor } from './calendar-seed';

/**
 * Lo que se configura una vez y sostiene el resto (D17): los **calendarios**
 * de la iglesia —crear con plantilla, renombrar, borrar, nunca el último— y
 * sus **sedes**. La siembra del andamiaje vive en `calendar-seed.ts`.
 */

export type LocalCalendar = Pick<Calendar, 'id' | 'name' | 'slug' | 'ministry' | 'position'>;

export async function listCalendars(churchId: string): Promise<LocalCalendar[]> {
    const db = await getDb();
    return db.getAllAsync<LocalCalendar>(
        'SELECT id, name, slug, ministry, position FROM calendars WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC, name ASC',
        churchId,
    );
}

/**
 * Crear un calendario: elegir **plantilla** es elegir la labor, y la labor es
 * lo que hace que la semana de esa labor se siembre ya en cada sede (§5.7).
 * Un calendario en blanco nace con la del púlpito, que es la semana de la
 * iglesia (`defaultWeekFor(null)`).
 */
export async function createCalendar(
    churchId: string,
    input: { name: string; ministry?: string | null },
): Promise<LocalCalendar> {
    const db = await getDb();
    const now = nowIso();

    let calendar!: LocalCalendar;
    await db.withTransactionAsync(async () => {
        const existing = await listCalendars(churchId);
        if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
            throw new Error('Ya hay un calendario con ese nombre');
        }

        // `pulpito`, `pulpito-2`… Dos calendarios pueden llamarse casi igual. El
        // slug es lo que identifica; el nombre se puede repetir (se comprueba
        // aparte, a la baja). La búsqueda incluye el slug **exacto**: «Púlpito
        // extra» deriva `pulpito` y chocaría con el de serie en el índice único.
        const base = toSlug(input.name, 40) || 'calendario';
        const taken = new Set(
            (
                await db.getAllAsync<{ slug: string }>(
                    'SELECT slug FROM calendars WHERE church_id = ? AND (slug = ? OR slug LIKE ?)',
                    churchId,
                    base,
                    `${base}-%`,
                )
            ).map((row) => row.slug),
        );
        let slug = base;
        for (let intento = 2; taken.has(slug); intento += 1) slug = `${base}-${intento}`;

        const ministry = input.ministry ?? null;
        calendar = {
            id: newId(),
            name: input.name,
            slug,
            ministry,
            position: existing.length,
        };

        await db.runAsync(
            'INSERT INTO calendars (id, created_at, updated_at, deleted_at, church_id, name, slug, ministry, position) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?)',
            calendar.id,
            now,
            now,
            churchId,
            calendar.name,
            calendar.slug,
            calendar.ministry,
            calendar.position,
        );

        // La semana del calendario nuevo, en cada sede activa (§5.7).
        const congregations = await db.getAllAsync<{ id: string; accent: string }>(
            'SELECT id, accent FROM congregations WHERE church_id = ? AND is_active = 1 AND deleted_at IS NULL ORDER BY position ASC',
            churchId,
        );
        for (const congregation of congregations) {
            await seedPatternFor(db, { id: calendar.id, ministry }, congregation, churchId, now);
        }
    });

    return calendar;
}

/** Renombrar **no cambia el slug**: cambia el nombre, que es lo que se lee (D15). */
export async function updateCalendar(
    churchId: string,
    input: { id: string; name?: string; ministry?: string | null },
): Promise<void> {
    const db = await getDb();
    const current = await db.getFirstAsync<{ name: string; ministry: string | null }>(
        'SELECT name, ministry FROM calendars WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
        churchId,
        input.id,
    );
    if (!current) throw new Error('Ese calendario no existe en esta iglesia');

    await db.runAsync(
        'UPDATE calendars SET name = ?, ministry = ?, updated_at = ? WHERE id = ?',
        input.name !== undefined ? input.name : current.name,
        input.ministry !== undefined ? input.ministry : current.ministry,
        nowIso(),
        input.id,
    );
}

export async function deleteCalendar(churchId: string, calendarId: string): Promise<void> {
    const db = await getDb();
    const all = await listCalendars(churchId);
    if (all.length <= 1) throw new Error('No se puede borrar el único calendario');

    await db.runAsync(
        'UPDATE calendars SET deleted_at = ?, updated_at = ? WHERE id = ?',
        nowIso(),
        nowIso(),
        calendarId,
    );
}

export type LocalCongregation = Pick<
    Congregation,
    'id' | 'name' | 'city' | 'accent' | 'position' | 'isDefault' | 'isActive'
>;

export async function listCongregations(churchId: string): Promise<LocalCongregation[]> {
    const db = await getDb();
    return (
        await db.getAllAsync<{
            id: string;
            churchId: string;
            name: string;
            city: string | null;
            accent: string;
            position: number;
            isDefault: number;
            isActive: number;
        }>(
            'SELECT id, church_id AS churchId, name, city, accent, position, is_default AS isDefault, is_active AS isActive FROM congregations WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC, name ASC',
            churchId,
        )
    ).map((one) => ({ ...one, isDefault: one.isDefault === 1, isActive: one.isActive === 1 }));
}

/**
 * Crear una sede: nombre y color, dos campos (D11) — se puede hacer desde el
 * propio día que se está programando. Siembra su semana en todos los
 * calendarios, como hace `WeekSeederService` en la API.
 */
export async function createCongregation(
    churchId: string,
    input: { name: string; city?: string; accent?: string },
): Promise<LocalCongregation> {
    const db = await getDb();
    const now = nowIso();

    let sede!: LocalCongregation;
    await db.withTransactionAsync(async () => {
        const yaHay = await db.getFirstAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM congregations WHERE church_id = ? AND name = ? AND deleted_at IS NULL',
            churchId,
            input.name,
        );
        if ((yaHay?.total ?? 0) > 0) throw new Error('Ya hay una sede con ese nombre');

        const contador = await db.getFirstAsync<{ total: number }>(
            'SELECT COUNT(*) AS total FROM congregations WHERE church_id = ? AND deleted_at IS NULL',
            churchId,
        );
        sede = {
            id: newId(),
            name: input.name,
            city: input.city || null,
            accent: input.accent ?? DEFAULT_CONGREGATION_ACCENT,
            position: contador?.total ?? 0,
            isDefault: false,
            isActive: true,
        };
        await db.runAsync(
            'INSERT INTO congregations (id, created_at, updated_at, deleted_at, church_id, name, city, accent, position, is_default, is_active) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 0, 1)',
            sede.id,
            now,
            now,
            churchId,
            sede.name,
            sede.city,
            sede.accent,
            sede.position,
        );

        // La semana de la sede nueva, en cada calendario de la iglesia (§5.7).
        const calendars = await db.getAllAsync<{ id: string; ministry: string | null }>(
            'SELECT id, ministry FROM calendars WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC',
            churchId,
        );
        for (const calendar of calendars) {
            await seedPatternFor(db, calendar, sede, churchId, now);
        }
    });

    return sede;
}

/** Editar o desactivar: se apaga sin perder el historial (§5.1). */
export async function updateCongregation(
    churchId: string,
    input: { id: string; name?: string; city?: string | null; accent?: string; isActive?: boolean },
): Promise<void> {
    const db = await getDb();
    const current = await db.getFirstAsync<{
        name: string;
        city: string | null;
        accent: string;
        is_active: number;
    }>(
        'SELECT name, city, accent, is_active FROM congregations WHERE church_id = ? AND id = ? AND deleted_at IS NULL',
        churchId,
        input.id,
    );
    if (!current) throw new Error('Esa sede no existe en esta iglesia');

    await db.runAsync(
        'UPDATE congregations SET name = ?, city = ?, accent = ?, is_active = ?, updated_at = ? WHERE id = ?',
        input.name !== undefined ? input.name : current.name,
        input.city !== undefined ? (input.city ?? null) : current.city,
        input.accent !== undefined ? input.accent : current.accent,
        input.isActive !== undefined ? (input.isActive ? 1 : 0) : current.is_active,
        nowIso(),
        input.id,
    );
}

/** Borrado lógico; nunca la última (§7). */
export async function deleteCongregation(churchId: string, congregationId: string): Promise<void> {
    const db = await getDb();
    const all = await listCongregations(churchId);
    if (all.length <= 1) throw new Error('No se puede borrar la última sede');

    await db.runAsync(
        'UPDATE congregations SET deleted_at = ?, updated_at = ? WHERE id = ?',
        nowIso(),
        nowIso(),
        congregationId,
    );
}
