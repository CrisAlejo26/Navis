import type { LocalRow } from '@navis/shared';

/** Columnas que suelen llevar el nombre legible de una fila, por orden de preferencia. */
const LABEL_COLUMNS = ['title', 'name', 'text', 'label', 'body'] as const;

const clip = (text: string): string => (text.length > 48 ? `${text.slice(0, 47)}…` : text);

/**
 * Cómo llamar a una entidad en pantalla: el nombre de una persona, el título de
 * una nota… Lo que no tiene nada legible se llama por su tabla, nunca por un
 * UUID suelto.
 */
export function describeEntity(table: string, row: LocalRow | null): string {
    if (!row) return table;
    if (typeof row.first_name === 'string') {
        return clip(
            `${row.first_name} ${typeof row.last_name === 'string' ? row.last_name : ''}`.trim(),
        );
    }
    for (const column of LABEL_COLUMNS) {
        const value = row[column];
        if (typeof value === 'string' && value.trim() !== '') return clip(value.trim());
    }
    return table;
}

/** Los nombres de campo, de `snake_case` a algo que se pueda leer. */
export const humanizeField = (field: string): string => field.replace(/_/g, ' ');
