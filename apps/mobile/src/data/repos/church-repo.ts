import {
    ACCENT_PALETTE,
    DEFAULT_CONGREGATION_ACCENT,
    SYSTEM_GIFTS,
    SYSTEM_MINISTRIES,
    toSearchName,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { deviceTimezone } from '../device-timezone';
import { seedCalendarScaffold } from './calendar-seed';

export interface LocalChurch {
    id: string;
    name: string;
    slug: string;
    city: string | null;
    timezone: string;
    country: string;
    ownerId: string;
}

function slugify(name: string): string {
    return toSearchName(name)
        .replaceAll(' ', '-')
        .replace(/^-+|-+$/g, '');
}

async function freeSlug(name: string): Promise<string> {
    const db = await getDb();
    const base = slugify(name) || 'iglesia';
    const taken = new Set(
        (
            await db.getAllAsync<{ slug: string }>(
                'SELECT slug FROM churches WHERE slug = ? OR slug LIKE ?',
                base,
                `${base}-%`,
            )
        ).map((row) => row.slug),
    );

    if (!taken.has(base)) return base;
    let attempt = 2;
    while (taken.has(`${base}-${attempt}`)) attempt++;
    return `${base}-${attempt}`;
}

export async function createChurch(input: {
    name: string;
    city: string;
    ownerId: string;
    country?: string;
}): Promise<LocalChurch> {
    const db = await getDb();
    const now = nowIso();

    const church: LocalChurch = {
        id: newId(),
        name: input.name,
        slug: await freeSlug(input.name),
        city: input.city || null,
        timezone: deviceTimezone(),
        country: input.country ?? 'ES',
        ownerId: input.ownerId,
    };

    await db.withTransactionAsync(async () => {
        await db.runAsync(
            'INSERT INTO churches (id, created_at, updated_at, deleted_at, name, slug, city, timezone, country, region, owner_id) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, NULL, ?)',
            church.id,
            now,
            now,
            church.name,
            church.slug,
            church.city,
            church.timezone,
            church.country,
            church.ownerId,
        );

        await db.runAsync(
            'INSERT INTO church_members (id, church_id, user_id, created_at, updated_at, deleted_at) VALUES (?, ?, ?, ?, ?, NULL)',
            newId(),
            church.id,
            church.ownerId,
            now,
            now,
        );
        await db.runAsync(
            'UPDATE local_user SET active_church_id = ?, updated_at = ? WHERE id = ?',
            church.id,
            now,
            church.ownerId,
        );
        await db.runAsync(
            'INSERT INTO congregations (id, created_at, updated_at, deleted_at, church_id, name, city, accent, position, is_default, is_active) VALUES (?, ?, ?, NULL, ?, ?, NULL, ?, 0, 1, 1)',
            newId(),
            now,
            now,
            church.id,
            input.city || 'Sede principal',
            DEFAULT_CONGREGATION_ACCENT,
        );

        for (const [index, name] of SYSTEM_GIFTS.entries()) {
            await db.runAsync(
                'INSERT INTO gifts (id, created_at, updated_at, deleted_at, church_id, name, accent, position, is_system, is_active) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 1, 1)',
                newId(),
                now,
                now,
                church.id,
                name,
                ACCENT_PALETTE[index % ACCENT_PALETTE.length],
                index,
            );
        }
        for (const [index, ministry] of SYSTEM_MINISTRIES.entries()) {
            await db.runAsync(
                'INSERT INTO ministries (id, created_at, updated_at, deleted_at, church_id, slug, name, accent, position, is_system, is_active) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 1, 1)',
                newId(),
                now,
                now,
                church.id,
                ministry.slug,
                ministry.name,
                ACCENT_PALETTE[index % ACCENT_PALETTE.length],
                index,
            );
        }

        await seedCalendarScaffold(db, church.id, now);
    });

    return church;
}

export async function findChurch(id: string): Promise<LocalChurch | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{
        id: string;
        name: string;
        slug: string;
        city: string | null;
        timezone: string;
        country: string;
        owner_id: string;
    }>(
        'SELECT id, name, slug, city, timezone, country, owner_id FROM churches WHERE id = ? AND deleted_at IS NULL',
        id,
    );

    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        city: row.city,
        timezone: row.timezone,
        country: row.country,
        ownerId: row.owner_id,
    };
}

/** Consulta heredada del dueño; para acceder se usa church-access. */
export async function findChurchByOwner(ownerId: string): Promise<LocalChurch | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{
        id: string;
        name: string;
        slug: string;
        city: string | null;
        timezone: string;
        country: string;
        owner_id: string;
    }>(
        'SELECT id, name, slug, city, timezone, country, owner_id FROM churches WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
        ownerId,
    );

    if (!row) return null;
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        city: row.city,
        timezone: row.timezone,
        country: row.country,
        ownerId: row.owner_id,
    };
}
