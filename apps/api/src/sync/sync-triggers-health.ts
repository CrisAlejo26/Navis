import { syncedTables, triggerStatements } from '@navis/shared';
import type { DataSource } from 'typeorm';

/**
 * Los triggers del registro se pierden en silencio si una migración recrea la
 * tabla a la que cuelgan (en SQLite, TypeORM lo hace al quitar o cambiar una
 * columna). Sin ellos la tabla deja de sincronizar y nada avisa. Esto compara lo
 * instalado con lo esperado y reinstala solo lo que falte (es idempotente).
 */
function names(rows: unknown, key: string): Set<string> {
    const found = new Set<string>();
    if (!Array.isArray(rows)) return found;
    for (const row of rows as unknown[]) {
        if (typeof row === 'object' && row !== null && key in row) {
            found.add(String((row as Record<string, unknown>)[key]));
        }
    }
    return found;
}

/** Tablas sincronizadas a las que les falta algún trigger. */
export async function tablesMissingTriggers(dataSource: DataSource): Promise<string[]> {
    if (dataSource.options.type === 'postgres') {
        const installed = names(
            await dataSource.query(
                `SELECT tgname FROM pg_trigger WHERE NOT tgisinternal AND tgname LIKE 'sync\\_%'`,
            ),
            'tgname',
        );
        return syncedTables().filter((table) => !installed.has(`sync_${table}`));
    }
    const installed = names(
        await dataSource.query(
            `SELECT name FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'sync\\_%' ESCAPE '\\'`,
        ),
        'name',
    );
    return syncedTables().filter((table) =>
        ['ai', 'au', 'ad'].some((suffix) => !installed.has(`sync_${table}_${suffix}`)),
    );
}

/** Reinstala los que falten y devuelve las tablas reparadas. */
export async function repairTriggers(dataSource: DataSource): Promise<string[]> {
    const missing = await tablesMissingTriggers(dataSource);
    if (missing.length === 0) return [];
    const driver = dataSource.options.type === 'postgres' ? 'postgres' : 'sqlite';
    for (const statement of triggerStatements(driver, missing)) {
        await dataSource.query(statement);
    }
    return missing;
}
