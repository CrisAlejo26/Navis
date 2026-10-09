import type { LocalRow } from './sync-codec';

/**
 * Catálogos de serie: filas que la API y cada teléfono siembran por su cuenta,
 * así que **el mismo «Pastor» tiene un UUID distinto en cada sitio** (plan de
 * sincronización, Fase 2). Su identidad es la clave natural, no el id: antes de
 * subir o aplicar nada, el id local se traduce al canónico con `mapCatalogIds`
 * y las referencias de `CATALOG_REFERENCES` se reescriben con ese mapa.
 */
export interface CatalogSpec {
    table: string;
    /** Cuándo una fila es de serie y no del usuario. */
    system: { column: string; equals: 0 | 1 } | { column: string; isNull: true };
    /** Columnas que identifican la fila de serie, junto con las de ámbito. */
    key: readonly string[];
}

export const SYNC_CATALOGS: readonly CatalogSpec[] = [
    { table: 'roles', system: { column: 'is_system', equals: 1 }, key: ['slug'] },
    { table: 'emotions', system: { column: 'owner_id', isNull: true }, key: ['slug'] },
    {
        table: 'ministries',
        system: { column: 'is_system', equals: 1 },
        key: ['church_id', 'slug'],
    },
    { table: 'gifts', system: { column: 'is_system', equals: 1 }, key: ['church_id', 'name'] },
    {
        table: 'believer_tags',
        system: { column: 'is_system', equals: 1 },
        key: ['church_id', 'name'],
    },
];

/** Columnas de otras tablas que apuntan al `id` de un catálogo y hay que reescribir al mapear. */
export const CATALOG_REFERENCES: readonly { table: string; column: string; catalog: string }[] = [
    { table: 'believer_gifts', column: 'gift_id', catalog: 'gifts' },
    { table: 'believer_notes', column: 'gift_id', catalog: 'gifts' },
    { table: 'believer_tag_links', column: 'tag_id', catalog: 'believer_tags' },
    { table: 'dream_emotions', column: 'emotion_id', catalog: 'emotions' },
];

/** Clave natural de una fila de serie, o `null` si es del usuario (o no tiene clave todavía). */
export function catalogKey(spec: CatalogSpec, row: LocalRow): string | null {
    const marker = row[spec.system.column];
    const isSystem = 'isNull' in spec.system ? marker === null : marker === spec.system.equals;
    if (!isSystem) return null;
    const values = spec.key.map((column) => row[column]);
    return values.some((value) => value === null || value === undefined)
        ? null
        : JSON.stringify(values);
}

/**
 * Id local → id canónico para las filas de serie que existen en los dos lados.
 * Las filas del usuario no se mapean: conservan su UUID. Dos filas canónicas con
 * la misma clave son un fallo de datos y se rechazan en vez de elegir una.
 */
export function mapCatalogIds(
    spec: CatalogSpec,
    local: readonly LocalRow[],
    canonical: readonly LocalRow[],
): Map<string, string> {
    const canonicalByKey = new Map<string, string>();
    for (const row of canonical) {
        const key = catalogKey(spec, row);
        if (key === null) continue;
        if (canonicalByKey.has(key)) {
            throw new Error(`${spec.table}: clave de serie repetida ${key}`);
        }
        canonicalByKey.set(key, String(row.id));
    }

    const mapping = new Map<string, string>();
    for (const row of local) {
        const key = catalogKey(spec, row);
        const target = key === null ? undefined : canonicalByKey.get(key);
        if (target !== undefined && target !== row.id) mapping.set(String(row.id), target);
    }
    return mapping;
}

/** Reescribe una referencia a catálogo; lo que no está en el mapa se deja como está. */
export function remapReference(mapping: ReadonlyMap<string, string>, id: string): string {
    return mapping.get(id) ?? id;
}
