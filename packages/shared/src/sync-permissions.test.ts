import { describe, expect, it } from 'vitest';

import { ALL_PERMISSIONS } from './permissions';
import { SYNC_COVERAGE } from './sync-coverage';
import { SYNC_READ_PERMISSION, deniedSyncTables } from './sync-permissions';

const synced = Object.entries(SYNC_COVERAGE)
    .filter(([, entry]) => entry.policy === 'synced')
    .map(([table]) => table);

describe('permisos de lectura de la sincronización', () => {
    it('cada tabla sincronizada declara su permiso (o null), y no sobran', () => {
        expect(Object.keys(SYNC_READ_PERMISSION).sort()).toEqual([...synced].sort());
    });

    it('un rol sin permisos solo pierde lo que exige permiso', () => {
        const denied = deniedSyncTables([]);
        expect(denied).toContain('believers');
        expect(denied).toContain('list_viewers');
        expect(denied).not.toContain('prophecies');
        expect(denied).not.toContain('churches');
    });

    it('quien puede ver creyentes no gana por ello las llaves de las listas', () => {
        const denied = deniedSyncTables(['believers.view', 'lists.view']);
        expect(denied).not.toContain('believers');
        expect(denied).not.toContain('lists');
        expect(denied).toContain('list_grants');
    });

    it('el superadministrador lo lee todo', () => {
        expect(deniedSyncTables([ALL_PERMISSIONS])).toEqual([]);
    });
});
