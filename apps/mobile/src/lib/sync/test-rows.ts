import { ALL_LOCAL_TABLES, columnKind } from '@navis/shared';

import { getDb } from '@/data/db';

let counter = 0;

/** Un valor válido para cada tipo de columna: un día, una hora y un instante no son texto cualquiera. */
function sampleValue(table: string, name: string, type: string): string | number {
    switch (columnKind(table, name)) {
        case 'day':
            return '2026-03-14';
        case 'time':
            return '19:30';
        case 'instant':
            return '2026-03-14T10:30:00.000Z';
        case 'json':
            return '{}';
        default:
            if (type === 'int' || type === 'real' || type === 'bool') return 1;
            return name.endsWith('_at') || name.endsWith('_date') ? '2026-03-14' : name + '-x';
    }
}

/** Un identificador con forma de uuid v4, único dentro del proceso de test. */
export const testUuid = (): string =>
    `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;

/**
 * Inserta en la base local de test una fila con valores de relleno en todas las
 * columnas obligatorias (los `values` pisan el relleno). Devuelve su `id`
 * (vacío en las tablas de clave compuesta).
 */
export async function insertSample(
    table: string,
    values: Record<string, string | number> = {},
): Promise<string> {
    const db = await getDb();
    const definition = ALL_LOCAL_TABLES.find((one) => one.name === table);
    if (!definition) throw new Error(table);
    const row: Record<string, string | number> = {};
    for (const column of definition.columns) {
        if (column.nullable) continue;
        if (column.default !== undefined) {
            row[column.name] =
                typeof column.default === 'boolean' ? Number(column.default) : column.default;
            continue;
        }
        row[column.name] = sampleValue(table, column.name, column.type);
    }
    if (definition.columns.some((column) => column.name === 'id')) row.id = testUuid();
    Object.assign(row, values);
    const names = Object.keys(row);
    await db.runAsync(
        `INSERT INTO "${table}" (${names.map((name) => `"${name}"`).join(', ')}) VALUES (${names.map(() => '?').join(', ')})`,
        ...Object.values(row),
    );
    return String(row.id ?? '');
}
