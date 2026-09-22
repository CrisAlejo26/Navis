import {
  ACCENT_PALETTE,
  DEFAULT_CONGREGATION_ACCENT,
  SYSTEM_GIFTS,
  SYSTEM_MINISTRIES,
  toSearchName,
} from '@navis/shared';

import { getDb, newId, nowIso } from '../db';
import { seedCalendarScaffold } from './calendar-seed';

/**
 * La iglesia **local** (RFC 0024, Fase 1): los mismos datos que crea
 * `ChurchesService.create` en la API —iglesia, miembro dueño, sede por
 * defecto y los catálogos de serie—, pero escritos en SQLite del teléfono.
 */

export interface LocalChurch {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  timezone: string;
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

/** La zona horaria del dispositivo: en local, es la de quien usa la app. */
function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Madrid';
  } catch {
    return 'Europe/Madrid';
  }
}

export async function createChurch(input: {
  name: string;
  city: string;
  ownerId: string;
}): Promise<LocalChurch> {
  const db = await getDb();
  const now = nowIso();

  const church: LocalChurch = {
    id: newId(),
    name: input.name,
    slug: await freeSlug(input.name),
    city: input.city || null,
    timezone: deviceTimezone(),
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
      'ES',
      church.ownerId,
    );

    // La sede de serie, como hace la API cuando a una iglesia nueva no le
    // queda ninguna: «Sede principal» y propuesta por defecto.
    await db.runAsync(
      'INSERT INTO congregations (id, created_at, updated_at, deleted_at, church_id, name, city, accent, position, is_default, is_active) VALUES (?, ?, ?, NULL, ?, ?, NULL, ?, 0, 1, 1)',
      newId(),
      now,
      now,
      church.id,
      input.city || 'Sede principal',
      DEFAULT_CONGREGATION_ACCENT,
    );

    // Los catálogos de serie, como `GiftsService.ensureFor()` y el de labores
    // en la API: una iglesia nueva no nace sin vocabulario, con el mismo
    // reparto de color de la paleta.
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

    // El andamiaje del calendario (RFC 0002 D15): los cuatro calendarios de
    // serie y la semana de cada uno en la sede recién creada. Sin ella, el
    // tab de Calendario nacería vacío y habría que escribir siete reuniones
    // antes de programar la primera.
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
    owner_id: string;
  }>(
    'SELECT id, name, slug, city, timezone, owner_id FROM churches WHERE id = ? AND deleted_at IS NULL',
    id,
  );

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    timezone: row.timezone,
    ownerId: row.owner_id,
  };
}

/** La iglesia de la cuenta local: una sola en este modo (Fase 1). */
export async function findChurchByOwner(ownerId: string): Promise<LocalChurch | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string;
    name: string;
    slug: string;
    city: string | null;
    timezone: string;
    owner_id: string;
  }>(
    'SELECT id, name, slug, city, timezone, owner_id FROM churches WHERE owner_id = ? AND deleted_at IS NULL ORDER BY created_at ASC',
    ownerId,
  );

  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    timezone: row.timezone,
    ownerId: row.owner_id,
  };
}
