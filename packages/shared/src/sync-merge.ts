import type { LocalRow } from './sync-codec';

/**
 * Comparación a tres bandas (Fase 6 del plan de sincronización): la versión base
 * (lo último que el servidor y este teléfono acordaron), la local y la remota.
 * Un campo que solo cambió en un lado se toma de ese lado; si cambió en los dos
 * y distinto, es un **conflicto** que decide una persona. Nunca gana «el último»,
 * y la hora del teléfono no interviene.
 */
export type Value = string | number | null;

export interface MergePolicy {
    /** Campos que no cuentan como edición (`updated_at`): se queda el más reciente. */
    ignored: ReadonlySet<string>;
    /** Campos de orden (`position`): ante un choque gana el remoto, que no pierde a nadie. */
    remoteWins: ReadonlySet<string>;
    /** Campos de texto con JSON de objeto que se fusionan clave a clave (celdas de una fila). */
    jsonObjects: ReadonlySet<string>;
    /** Campos de máximo (`last_note_at`): gana el valor mayor. */
    maxWins: ReadonlySet<string>;
    /** Campos derivados de otros (`search_name`): siguen al lado que aportó sus fuentes. */
    derived: Readonly<Record<string, readonly string[]>>;
}

export const EMPTY_POLICY: MergePolicy = {
    ignored: new Set(),
    remoteWins: new Set(),
    jsonObjects: new Set(),
    maxWins: new Set(),
    derived: {},
};

export interface MergeResult {
    merged: LocalRow;
    /** Los campos en conflicto: en `merged` llevan el valor local, a la espera de decisión. */
    conflicts: string[];
    /** Los campos que se tomaron del servidor. */
    fromRemote: string[];
}

const same = (a: Value | undefined, b: Value | undefined): boolean => (a ?? null) === (b ?? null);

function parseObject(value: Value | undefined): Record<string, unknown> | null {
    if (typeof value !== 'string') return value === null || value === undefined ? {} : null;
    try {
        const parsed: unknown = JSON.parse(value);
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

const sameJson = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);

/** Fusiona dos objetos clave a clave sobre su base; `null` si alguna clave choca (o no son objetos). */
function mergeObjects(base: Value | undefined, local: Value, remote: Value): string | null {
    const b = parseObject(base);
    const l = parseObject(local);
    const r = parseObject(remote);
    if (!b || !l || !r) return null;
    const out: Record<string, unknown> = {};
    for (const key of new Set([...Object.keys(l), ...Object.keys(r), ...Object.keys(b)])) {
        const [kb, kl, kr] = [b[key], l[key], r[key]];
        let chosen: unknown;
        if (sameJson(kl, kr)) chosen = kl;
        else if (sameJson(kl, kb)) chosen = kr;
        else if (sameJson(kr, kb)) chosen = kl;
        else return null;
        if (chosen !== undefined) out[key] = chosen;
    }
    return JSON.stringify(out);
}

/** Mezcla una fila. `base` es `null` si esta entidad nunca se confirmó con el servidor. */
export function mergeThreeWay(
    base: LocalRow | null,
    local: LocalRow,
    remote: LocalRow,
    policy: MergePolicy = EMPTY_POLICY,
): MergeResult {
    const merged: LocalRow = {};
    const conflicts: string[] = [];
    const fromRemote: string[] = [];
    const fields = new Set([...Object.keys(local), ...Object.keys(remote)]);

    for (const field of fields) {
        if (field in policy.derived) continue; // se resuelve al final, según sus fuentes
        const [l, r] = [local[field] ?? null, remote[field] ?? null];
        const b = base ? base[field] : undefined;

        if (same(l, r)) {
            merged[field] = l;
        } else if (policy.ignored.has(field)) {
            merged[field] = String(l ?? '') >= String(r ?? '') ? l : r;
        } else if (base && same(l, b)) {
            merged[field] = r;
            fromRemote.push(field);
        } else if (base && same(r, b)) {
            merged[field] = l;
        } else if (policy.maxWins.has(field)) {
            merged[field] = String(l ?? '') >= String(r ?? '') ? l : r;
        } else if (policy.remoteWins.has(field)) {
            merged[field] = r;
            fromRemote.push(field);
        } else if (policy.jsonObjects.has(field) && base) {
            const objects = mergeObjects(b, l, r);
            if (objects === null) {
                merged[field] = l;
                conflicts.push(field);
            } else {
                merged[field] = objects;
                if (objects !== l) fromRemote.push(field);
            }
        } else {
            merged[field] = l;
            conflicts.push(field);
        }
    }

    for (const [field, sources] of Object.entries(policy.derived)) {
        const remoteSource = sources.some((source) => fromRemote.includes(source));
        merged[field] = remoteSource ? (remote[field] ?? null) : (local[field] ?? null);
        if (remoteSource) fromRemote.push(field);
    }

    return { merged, conflicts, fromRemote };
}
