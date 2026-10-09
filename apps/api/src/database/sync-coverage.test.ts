import { ALL_LOCAL_TABLES, LOCAL_USER_TABLE, SYNC_COVERAGE } from '@navis/shared';
import { getMetadataArgsStorage } from 'typeorm';
import { describe, expect, it } from 'vitest';

import { dataSourceOptions } from './data-source';

/**
 * Cobertura de la sincronización (Fase 2): ninguna tabla de la API queda sin
 * política, y la política no contradice lo que el móvil tiene de verdad.
 * Protege contra «añadí una entidad y se me olvidó que tiene que sincronizar».
 */
function apiTables(): string[] {
    const entities = (dataSourceOptions.entities ?? []) as (new () => object)[];
    const declared = getMetadataArgsStorage().tables;
    return entities.map((entity) => {
        const name = declared.find((table) => table.target === entity)?.name;
        if (typeof name !== 'string') throw new Error(`Entidad sin tabla: ${entity.name}`);
        return name;
    });
}

describe('cobertura de sincronización', () => {
    const tables = apiTables();

    it('declara una política para cada tabla de la API', () => {
        const missing = tables.filter((name) => !(name in SYNC_COVERAGE));
        expect(missing).toEqual([]);
    });

    it('no conserva políticas de tablas que ya no existen', () => {
        const stale = Object.keys(SYNC_COVERAGE).filter((name) => !tables.includes(name));
        expect(stale).toEqual([]);
    });

    it('toda tabla marcada como sincronizada tiene su espejo local', () => {
        const local = new Set(ALL_LOCAL_TABLES.map((table) => table.name));
        const lacking = Object.entries(SYNC_COVERAGE)
            .filter(([, entry]) => entry.policy === 'synced')
            .map(([name]) => name)
            .filter((name) => !local.has(name));
        expect(lacking).toEqual([]);
    });

    it('toda tabla local con espejo en la API está declarada como sincronizada', () => {
        const unexpected = ALL_LOCAL_TABLES.map((table) => table.name)
            .filter((name) => name !== LOCAL_USER_TABLE.name && name in SYNC_COVERAGE)
            .filter((name) => SYNC_COVERAGE[name]?.policy !== 'synced');
        expect(unexpected).toEqual([]);
    });
});
