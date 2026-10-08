import { describe, expect, it } from 'vitest';

import {
    MODULE_LABEL_KEY,
    PERMISSION_ACTION_LABEL_KEY,
    grantedByModule,
    permissionAction,
} from './permission-display';
import { PERMISSIONS, PERMISSION_MODULES } from './permissions';

describe('presentación de los permisos', () => {
    it('cada módulo y cada acción tienen su clave de traducción', () => {
        expect(Object.keys(MODULE_LABEL_KEY).sort()).toEqual([...PERMISSION_MODULES].sort());
        for (const permission of PERMISSIONS)
            expect(PERMISSION_ACTION_LABEL_KEY).toHaveProperty(permissionAction(permission));
    });

    it('distingue ver, gestionar y publicar por el final del permiso', () => {
        expect(permissionAction('lists.view')).toBe('view');
        expect(permissionAction('lists.manage')).toBe('manage');
        expect(permissionAction('lists.share')).toBe('share');
    });

    it('agrupa por módulo lo concedido, en el orden de la pantalla, y omite lo que no se tiene', () => {
        const rows = grantedByModule(
            ['lists.manage', 'lists.view', 'calendar.view', 'permiso.antiguo'],
            PERMISSION_MODULES,
        );
        expect(rows.map((row) => row.module)).toEqual(['calendar', 'lists']);
        expect(rows[1]?.permissions).toEqual(['lists.view', 'lists.manage']);
        expect(grantedByModule([], PERMISSION_MODULES)).toEqual([]);
    });
});
