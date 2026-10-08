import type { RoleRow } from '@navis/shared';

import {
    checkCreateRole,
    checkEditRole,
    emptyRoleForm,
    roleFormOf,
    withPermission,
} from './role-form';

function role(over: Partial<RoleRow>): RoleRow {
    return {
        id: 'r1',
        slug: 'tesoreria',
        name: 'Tesorería',
        description: null,
        level: 1,
        permissions: ['users.view'],
        isSystem: false,
        usersCount: 0,
        ...over,
    };
}

describe('formulario de roles', () => {
    it('el alta pide un nombre de dos letras y se queda con lo marcado', () => {
        expect(checkCreateRole(emptyRoleForm())).toEqual({
            ok: false,
            errors: { name: 'roles.fieldRoleName' },
        });
        const values = withPermission(
            { ...emptyRoleForm(), name: ' Tesorería ', description: ' Las cuentas ', level: 2 },
            'lists.view',
            true,
        );
        expect(checkCreateRole(values)).toEqual({
            ok: true,
            input: {
                name: 'Tesorería',
                description: 'Las cuentas',
                level: 2,
                permissions: ['lists.view'],
            },
        });
    });

    it('marcar y desmarcar un permiso no duplica ni conserva el quitado', () => {
        let values = emptyRoleForm();
        values = withPermission(values, 'lists.view', true);
        values = withPermission(values, 'lists.view', true);
        expect(values.permissions).toEqual(['lists.view']);
        values = withPermission(values, 'lists.view', false);
        expect(values.permissions).toEqual([]);
    });

    it('un rol propio edita nombre, nivel, descripción y permisos, y solo envía lo cambiado', () => {
        const tesoreria = role({});
        expect(checkEditRole(tesoreria, roleFormOf(tesoreria))).toEqual({
            ok: true,
            unchanged: true,
        });
        const edited = withPermission(
            { ...roleFormOf(tesoreria), name: 'Tesorería y ofrendas', level: 2 },
            'lists.view',
            true,
        );
        expect(checkEditRole(tesoreria, edited)).toEqual({
            ok: true,
            unchanged: false,
            update: {
                name: 'Tesorería y ofrendas',
                level: 2,
                permissions: ['users.view', 'lists.view'],
            },
        });
        expect(checkEditRole(tesoreria, { ...roleFormOf(tesoreria), name: 'A' })).toMatchObject({
            ok: false,
        });
    });

    it('vaciar la descripción la borra; un rol de serie ignora nombre y nivel', () => {
        const withText = role({ description: 'Las cuentas' });
        expect(checkEditRole(withText, { ...roleFormOf(withText), description: '  ' })).toEqual({
            ok: true,
            unchanged: false,
            update: { description: null },
        });
        const pastor = role({ slug: 'pastor', name: null, level: 2, isSystem: true });
        const tried = { ...roleFormOf(pastor), name: 'Otro', level: 0, description: 'Nuevo' };
        expect(checkEditRole(pastor, tried)).toEqual({
            ok: true,
            unchanged: false,
            update: { description: 'Nuevo' },
        });
    });

    // Quitarle el comodín al superadministrador dejaría la instalación sin quien lo devuelva.
    it('el superadministrador no envía nunca permisos, aunque cambien', () => {
        const superadmin = role({
            slug: 'superadmin',
            name: null,
            level: 3,
            isSystem: true,
            permissions: ['*'],
        });
        const values = withPermission(roleFormOf(superadmin), 'lists.view', true);
        expect(checkEditRole(superadmin, values)).toEqual({ ok: true, unchanged: true });
    });

    it('un permiso que ya no existe no se pinta, no cuenta como cambio y no se reenvía', () => {
        const old = role({ permissions: ['users.view', 'permiso.antiguo'] });
        expect(roleFormOf(old).permissions).toEqual(['users.view']);
        expect(checkEditRole(old, roleFormOf(old))).toEqual({ ok: true, unchanged: true });
    });
});
