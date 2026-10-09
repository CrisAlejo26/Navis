import { describe, expect, it } from 'vitest';

import { ALL_LOCAL_TABLES } from './local-schema';
import {
    CATALOG_REFERENCES,
    SYNC_CATALOGS,
    catalogKey,
    mapCatalogIds,
    remapReference,
} from './sync-catalogs';

const roles = SYNC_CATALOGS.find((spec) => spec.table === 'roles');
const emotions = SYNC_CATALOGS.find((spec) => spec.table === 'emotions');
if (!roles || !emotions) throw new Error('faltan catálogos');

describe('catálogos de serie', () => {
    it('cada catálogo y cada referencia apuntan a tablas y columnas que existen', () => {
        const columns = (name: string) =>
            ALL_LOCAL_TABLES.find((table) => table.name === name)?.columns.map((c) => c.name) ?? [];
        for (const spec of SYNC_CATALOGS) {
            for (const column of [spec.system.column, ...spec.key]) {
                expect(columns(spec.table), `${spec.table}.${column}`).toContain(column);
            }
        }
        for (const ref of CATALOG_REFERENCES) {
            expect(columns(ref.table), `${ref.table}.${ref.column}`).toContain(ref.column);
            expect(SYNC_CATALOGS.some((spec) => spec.table === ref.catalog)).toBe(true);
        }
    });

    it('mapea el «Pastor» del teléfono al del servidor aunque tengan UUID distinto', () => {
        const local = [
            { id: 'L1', slug: 'pastor', is_system: 1 },
            { id: 'L2', slug: 'mi-rol', is_system: 0 },
        ];
        const server = [
            { id: 'S1', slug: 'pastor', is_system: 1 },
            { id: 'S2', slug: 'mi-rol', is_system: 0 },
        ];
        const mapping = mapCatalogIds(roles, local, server);
        expect([...mapping]).toEqual([['L1', 'S1']]);
        expect(remapReference(mapping, 'L1')).toBe('S1');
        expect(remapReference(mapping, 'L2')).toBe('L2');
    });

    it('en emociones las de serie son las de dueño nulo y las propias no se mapean', () => {
        expect(catalogKey(emotions, { id: 'a', owner_id: null, slug: 'paz' })).not.toBeNull();
        expect(catalogKey(emotions, { id: 'b', owner_id: 'u1', slug: null })).toBeNull();
    });

    it('rechaza dos filas canónicas con la misma clave en vez de elegir una', () => {
        const dup = [
            { id: 'S1', slug: 'pastor', is_system: 1 },
            { id: 'S2', slug: 'pastor', is_system: 1 },
        ];
        expect(() => mapCatalogIds(roles, [], dup)).toThrow('repetida');
    });

    it('no mapea nada cuando el id ya coincide', () => {
        const row = { id: 'S1', slug: 'pastor', is_system: 1 };
        expect(mapCatalogIds(roles, [row], [row]).size).toBe(0);
    });
});
