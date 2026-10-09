import { bytesToHex } from '@noble/hashes/utils.js';
import { cellsFromWire, cellsToWire, decodeRow, type LocalRow } from '@navis/shared';
import { getRandomBytes } from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

import type { LocalDb } from '@/data/local-db';
import { sha256Hex } from '@/lib/backup/backup-integrity';
import { decryptCell, encryptCell } from '@/lib/tables/crypto';

import { localTable } from './wire-row';

/**
 * Las contraseñas de las tablas personalizadas (Fase 3) son el único dato que
 * este aparato cifra con su propia clave. Los metadatos de sincronización —la
 * versión base, las instantáneas de un conflicto— **no** las guardan en claro:
 * serían un segundo sitio con la contraseña a la vista. Guardan una **huella**
 * (SHA-256 con una clave secreta del aparato): sirve para saber si una contraseña
 * cambió y no permite recuperarla. Para fusionar, las contraseñas se tienen en
 * claro un momento, en memoria.
 */
const SECRET_TABLE = 'custom_table_rows';
const FINGERPRINT_KEY = 'navis.sync.fingerprint-key';
const FINGERPRINT_PREFIX = 'fp:';

let fingerprintSecret: Promise<string> | null = null;

function secret(): Promise<string> {
    fingerprintSecret ??= (async () => {
        const stored = await SecureStore.getItemAsync(FINGERPRINT_KEY);
        if (stored) return stored;
        const fresh = bytesToHex(getRandomBytes(32));
        await SecureStore.setItemAsync(FINGERPRINT_KEY, fresh);
        return fresh;
    })();
    return fingerprintSecret;
}

async function passwordKeys(db: LocalDb, tableId: unknown): Promise<string[]> {
    if (typeof tableId !== 'string') return [];
    const columns = await db.getAllAsync<{ key: string }>(
        "SELECT key FROM custom_table_columns WHERE table_id = ? AND type = 'password'",
        tableId,
    );
    return columns.map((column) => column.key);
}

function parseData(row: LocalRow): Record<string, unknown> | null {
    if (typeof row.data !== 'string') return null;
    try {
        const parsed: unknown = JSON.parse(row.data);
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
            ? (parsed as Record<string, unknown>)
            : null;
    } catch {
        return null;
    }
}

/** La fila con las contraseñas en claro, solo para compararla en memoria. */
export async function unsealRow(table: string, row: LocalRow): Promise<LocalRow> {
    const data = table === SECRET_TABLE ? parseData(row) : null;
    if (!data) return row;
    return { ...row, data: JSON.stringify(await cellsToWire(data, (e) => decryptCell(e))) };
}

/** Lo contrario: las contraseñas vuelven a sellarse con la clave de este aparato antes de guardar. */
export async function sealRow(db: LocalDb, table: string, row: LocalRow): Promise<LocalRow> {
    const data = table === SECRET_TABLE ? parseData(row) : null;
    if (!data) return row;
    const sealed = await cellsFromWire(data, await passwordKeys(db, row.table_id), (p) =>
        encryptCell(p),
    );
    return { ...row, data: JSON.stringify(sealed) };
}

export interface Fingerprinted {
    /** La fila con cada contraseña sustituida por su huella. */
    row: LocalRow;
    /** Huella → contraseña, para deshacerlo después de fusionar (solo en memoria). */
    originals: ReadonlyMap<string, string>;
}

/** Sustituye las contraseñas (en claro) por huellas. El resto de la fila no se toca. */
export async function fingerprintRow(
    db: LocalDb,
    table: string,
    row: LocalRow,
): Promise<Fingerprinted> {
    const originals = new Map<string, string>();
    const data = table === SECRET_TABLE ? parseData(row) : null;
    if (!data) return { row, originals };
    const key = await secret();
    for (const name of await passwordKeys(db, row.table_id)) {
        const value = data[name];
        if (typeof value !== 'string' || value === '') continue;
        const print = FINGERPRINT_PREFIX + sha256Hex(`${key}:${value}`);
        originals.set(print, value);
        data[name] = print;
    }
    return { row: { ...row, data: JSON.stringify(data) }, originals };
}

/** Devuelve cada huella a su contraseña (las que no se conocen se dejan: son de la base). */
export function restoreRow(row: LocalRow, originals: ReadonlyMap<string, string>): LocalRow {
    if (originals.size === 0) return row;
    const data = parseData(row);
    if (!data) return row;
    for (const [name, value] of Object.entries(data)) {
        const original = typeof value === 'string' ? originals.get(value) : undefined;
        if (original !== undefined) data[name] = original;
    }
    return { ...row, data: JSON.stringify(data) };
}

/**
 * La fila tal y como puede guardarse en un metadato: con las contraseñas
 * (selladas o en claro) convertidas en huellas.
 */
export async function scrubRow(db: LocalDb, table: string, row: LocalRow): Promise<LocalRow> {
    return (await fingerprintRow(db, table, await unsealRow(table, row))).row;
}

/** Una fila del protocolo convertida a la forma de SQLite y sin contraseñas (para la versión base). */
export async function baseFromWire(
    db: LocalDb,
    table: string,
    wire: Readonly<Record<string, unknown>>,
): Promise<LocalRow> {
    return scrubRow(db, table, decodeRow(localTable(table), wire));
}
