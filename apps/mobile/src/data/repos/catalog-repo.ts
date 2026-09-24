import {
    ACCENT_PALETTE,
    toMinistrySlug,
    type Gift,
    type MinistryCatalog,
    type BelieverTag,
} from '@navis/shared';

import type { SQLiteBindValue } from 'expo-sqlite';

import { getDb, newId, nowIso } from '../db';

/**
 * Los catálogos de la iglesia **en local**: dones, labores, etiquetas y sedes.
 * El nombre de cada entrada **no se traduce** —es dato de la iglesia (D6)—;
 * lo que sí va en los seis idiomas es todo lo que lo rodea.
 */

const CATALOG_COLUMNS = 'id, church_id, name, accent, position, is_system, is_active';

interface CatalogRow {
    id: string;
    church_id: string;
    name: string;
    accent: string;
    position: number;
    is_system: number;
    is_active: number;
}

function toCatalog<T>(row: CatalogRow, extra: (row: CatalogRow) => Partial<T> = () => ({})): T {
    return {
        id: row.id,
        churchId: row.church_id,
        name: row.name,
        accent: row.accent,
        position: row.position,
        isSystem: row.is_system === 1,
        isActive: row.is_active === 1,
        ...extra(row),
    } as T;
}

export async function listGifts(churchId: string): Promise<Gift[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<CatalogRow>(
        `SELECT ${CATALOG_COLUMNS} FROM gifts WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC, name ASC`,
        churchId,
    );
    return rows.map((row) => toCatalog<Gift>(row));
}

export async function listMinistries(churchId: string): Promise<MinistryCatalog[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<CatalogRow & { slug: string }>(
        `SELECT ${CATALOG_COLUMNS}, slug FROM ministries WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC, name ASC`,
        churchId,
    );
    return rows.map((row) => toCatalog<MinistryCatalog>(row, () => ({ slug: row.slug })));
}

export async function listTags(churchId: string): Promise<BelieverTag[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<CatalogRow>(
        `SELECT ${CATALOG_COLUMNS} FROM believer_tags WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC, name ASC`,
        churchId,
    );
    return rows.map((row) => toCatalog<BelieverTag>(row));
}

export async function listCongregations(
    churchId: string,
): Promise<{ id: string; name: string; accent: string }[]> {
    const db = await getDb();
    return db.getAllAsync(
        'SELECT id, name, accent FROM congregations WHERE church_id = ? AND deleted_at IS NULL ORDER BY position ASC, name ASC',
        churchId,
    );
}

export type CatalogKind = 'gifts' | 'ministries' | 'tags';

const TABLE: Record<CatalogKind, string> = {
    gifts: 'gifts',
    ministries: 'ministries',
    tags: 'believer_tags',
};

/** Crea una entrada de catálogo. En labores el slug se genera del nombre. */
export async function createCatalogEntry(
    kind: CatalogKind,
    churchId: string,
    input: { name: string; accent?: string },
): Promise<void> {
    const db = await getDb();
    const now = nowIso();

    // Como la API (400 «Ya hay un don con ese nombre»): el vocabulario es de la
    // iglesia y dos entradas con el mismo nombre son dos datos, no uno.
    const name = input.name.trim();
    const existing = await listCatalog(kind, churchId);
    if (existing.some((one) => one.name.toLowerCase() === name.toLowerCase())) {
        throw new Error('duplicate');
    }

    const slug = kind === 'ministries' ? await uniqueSlug(churchId, name) : null;
    const position =
        (
            await db.getFirstAsync<{ total: number }>(
                `SELECT COUNT(*) AS total FROM ${TABLE[kind]} WHERE church_id = ? AND deleted_at IS NULL`,
                churchId,
            )
        )?.total ?? 0;
    const accent = input.accent ?? ACCENT_PALETTE[position % ACCENT_PALETTE.length];

    if (kind === 'ministries') {
        await db.runAsync(
            'INSERT INTO ministries (id, created_at, updated_at, deleted_at, church_id, slug, name, accent, position, is_system, is_active) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, 0, 1)',
            newId(),
            now,
            now,
            churchId,
            slug,
            name,
            accent,
            position,
        );
        return;
    }
    await db.runAsync(
        `INSERT INTO ${TABLE[kind]} (id, created_at, updated_at, deleted_at, church_id, name, accent, position, is_system, is_active) VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 0, 1)`,
        newId(),
        now,
        now,
        churchId,
        name,
        accent,
        position,
    );
}

async function listCatalog(
    kind: CatalogKind,
    churchId: string,
): Promise<{ id: string; name: string }[]> {
    const db = await getDb();
    return db.getAllAsync(
        `SELECT id, name FROM ${TABLE[kind]} WHERE church_id = ? AND deleted_at IS NULL`,
        churchId,
    );
}

async function uniqueSlug(churchId: string, name: string): Promise<string> {
    const db = await getDb();
    const base = toMinistrySlug(name) || 'labor';
    const taken = new Set(
        (
            await db.getAllAsync<{ slug: string }>(
                'SELECT slug FROM ministries WHERE church_id = ? AND deleted_at IS NULL AND (slug = ? OR slug LIKE ?)',
                churchId,
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

/** Renombra, cambia el color y enciende/apaga. Borrar solo lo que no es de serie. */
export async function updateCatalogEntry(
    kind: CatalogKind,
    id: string,
    churchId: string,
    input: { name?: string; accent?: string; isActive?: boolean },
): Promise<void> {
    const db = await getDb();
    const fields: string[] = [];
    const params: SQLiteBindValue[] = [];

    if (input.name !== undefined) {
        const name = input.name.trim();
        // Como la API: el duplicado se comprueba aquí, con mensaje propio.
        const others = (await listCatalog(kind, churchId)).filter((one) => one.id !== id);
        if (others.some((one) => one.name.toLowerCase() === name.toLowerCase())) {
            throw new Error('duplicate');
        }
        fields.push('name = ?');
        params.push(name);
        // En labores el slug **no** se toca: está guardado en cada persona y
        // renombrar la labor no puede romper ese vínculo (MinistriesService).
    }
    if (input.accent !== undefined) {
        fields.push('accent = ?');
        params.push(input.accent);
    }
    if (input.isActive !== undefined) {
        fields.push('is_active = ?');
        params.push(input.isActive ? 1 : 0);
    }
    if (fields.length === 0) return;
    await db.runAsync(
        `UPDATE ${TABLE[kind]} SET ${fields.join(', ')}, updated_at = ? WHERE id = ? AND church_id = ? AND deleted_at IS NULL`,
        ...params,
        nowIso(),
        id,
        churchId,
    );
}

export async function deleteCatalogEntry(
    kind: CatalogKind,
    id: string,
    churchId: string,
): Promise<void> {
    const db = await getDb();
    await db.runAsync(
        `UPDATE ${TABLE[kind]} SET deleted_at = ?, updated_at = ? WHERE id = ? AND church_id = ? AND is_system = 0`,
        nowIso(),
        nowIso(),
        id,
        churchId,
    );
}
