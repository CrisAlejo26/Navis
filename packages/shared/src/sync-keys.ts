import { ALL_LOCAL_TABLES } from './local-schema';

/**
 * Tablas cuya clave primaria **no** es `id` sino un par de columnas (las
 * pertenencias de una lista y las concesiones de acceso). Su identificador de
 * sincronización es el par unido con `:`; los UUID no contienen ese carácter.
 * Una tabla sin `id` que no esté aquí hace fallar al generador de triggers.
 */
export const SYNC_COMPOSITE_KEYS: Readonly<Record<string, readonly [string, string]>> = {
    list_members: ['list_id', 'believer_id'],
    list_grants: ['viewer_id', 'list_id'],
};

const SEPARATOR = ':';

/** Las columnas que forman la clave de una tabla: `['id']` salvo en las compuestas. */
export function entityKeyColumns(table: string): readonly string[] {
    const composite = SYNC_COMPOSITE_KEYS[table];
    if (composite) return composite;
    const definition = ALL_LOCAL_TABLES.find((one) => one.name === table);
    if (!definition?.columns.some((column) => column.name === 'id')) {
        throw new Error(`${table}: sin columna id y sin clave compuesta declarada`);
    }
    return ['id'];
}

/** El identificador de una fila a partir de sus columnas de clave. */
export function joinEntityId(table: string, key: Readonly<Record<string, string>>): string {
    return entityKeyColumns(table)
        .map((column) => key[column] ?? '')
        .join(SEPARATOR);
}

/** Lo contrario: las columnas de clave de un identificador. */
export function splitEntityId(table: string, id: string): Record<string, string> {
    const columns = entityKeyColumns(table);
    const parts = id.split(SEPARATOR);
    if (parts.length !== columns.length) throw new Error(`${table}: identificador inválido`);
    return Object.fromEntries(columns.map((column, index) => [column, parts[index] ?? '']));
}
