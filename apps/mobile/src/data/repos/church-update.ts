import { updateChurchSchema, type UpdateChurchInput } from '@navis/shared';

import { getDb, nowIso } from '../db';
import { findChurch, type LocalChurch } from './church-repo';

/** Columna de `churches` por cada campo editable: el nombre del campo no es el de la columna. */
const COLUMNS = {
    name: 'name',
    city: 'city',
    timezone: 'timezone',
    country: 'country',
    region: 'region',
} as const satisfies Record<keyof UpdateChurchInput, string>;

/**
 * Guarda la ficha de la iglesia con el mismo esquema que la web
 * (`updateChurchSchema`): lo que no pasa no se toca. El `slug` no cambia aunque
 * cambie el nombre, igual que en la API: es estable, para rutas y registros.
 */
export async function updateChurch(id: string, input: unknown): Promise<LocalChurch | null> {
    const data = updateChurchSchema.parse(input);
    const fields = (Object.keys(COLUMNS) as (keyof UpdateChurchInput)[]).filter(
        (key) => data[key] !== undefined,
    );

    if (fields.length > 0) {
        const db = await getDb();
        await db.runAsync(
            `UPDATE churches SET ${fields.map((key) => `${COLUMNS[key]} = ?`).join(', ')}, updated_at = ? WHERE id = ? AND deleted_at IS NULL`,
            ...fields.map((key) => data[key] ?? null),
            nowIso(),
            id,
        );
    }

    return findChurch(id);
}
