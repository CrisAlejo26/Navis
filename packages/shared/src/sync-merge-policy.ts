import { ALL_LOCAL_TABLES } from './local-schema';
import { EMPTY_POLICY, type MergePolicy } from './sync-merge';

/**
 * La política de fusión de cada tabla (Fase 6). Lo que no está aquí se fusiona
 * con la regla general: campo a campo, y un choque lo decide una persona.
 *
 * - `updated_at` no es una edición: es la marca de la última escritura.
 * - `position` ordena listas y fases: ante un choque manda el servidor, así
 *   ningún miembro se pierde ni se duplica.
 * - Las celdas de una fila de tabla personalizada (`data`) se comparan celda a
 *   celda, no como una sola cadena: dos personas editando columnas distintas de
 *   la misma fila no chocan.
 * - `last_note_at` es la fecha de la última nota: gana la mayor.
 * - `search_name` / `search_text` se derivan del nombre o del texto: siguen al
 *   lado del que se tomó el nombre o el texto.
 */
const JSON_OBJECTS: Readonly<Record<string, readonly string[]>> = {
    custom_table_rows: ['data'],
    tasks: ['repeat_options'],
};

const MAX_WINS: Readonly<Record<string, readonly string[]>> = {
    believers: ['last_note_at'],
};

const DERIVED: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
    believers: { search_name: ['first_name', 'last_name'] },
    teachings: { search_text: ['title', 'body_json'] },
    prophecies: { search_text: ['title', 'body'] },
    dreams: { search_text: ['title', 'body', 'interpretation'] },
};

export function mergePolicyFor(table: string): MergePolicy {
    const columns = ALL_LOCAL_TABLES.find((one) => one.name === table)?.columns.map((c) => c.name);
    if (!columns) return EMPTY_POLICY;
    return {
        ignored: new Set(['updated_at']),
        remoteWins: new Set(columns.includes('position') ? ['position'] : []),
        jsonObjects: new Set(JSON_OBJECTS[table] ?? []),
        maxWins: new Set(MAX_WINS[table] ?? []),
        derived: DERIVED[table] ?? {},
    };
}
