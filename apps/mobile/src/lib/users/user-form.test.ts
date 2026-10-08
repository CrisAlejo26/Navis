import type { ManagedUser, RoleRow } from '@navis/shared';

import { UsersError } from '@/data/users/users-gateway';
import { assignableRoles } from './assignable-roles';
import { checkCreate, checkEdit, emailChanged, emptyUserForm, userFormOf } from './user-form';
import { userErrorKey } from './user-errors';

const ana: ManagedUser = {
    id: 'u1',
    name: 'Ana García',
    email: 'ana@navis.app',
    role: 'recepcion',
    emailVerified: true,
    createdAt: new Date('2026-10-08T12:00:00Z'),
};

function role(slug: string, level: number): RoleRow {
    return {
        id: slug,
        slug,
        name: null,
        description: null,
        level,
        permissions: [],
        isSystem: true,
        usersCount: 0,
    };
}

describe('formulario de cuentas', () => {
    it('el alta pide nombre, correo, contraseña fuerte y rol, y dice qué falta', () => {
        const empty = checkCreate(emptyUserForm());
        expect(empty).toEqual({
            ok: false,
            errors: {
                name: 'roles.fieldName',
                email: 'roles.fieldEmail',
                password: 'auth.passwordHint',
                role: 'roles.fieldRole',
            },
        });
        const weak = checkCreate({ ...userFormOf(ana), password: 'corta' });
        expect(weak).toMatchObject({ ok: false, errors: { password: 'auth.passwordHint' } });
    });

    it('un alta válida normaliza el correo', () => {
        const result = checkCreate({
            name: ' Luis Soto ',
            email: ' LUIS@Navis.app ',
            password: 'MuySegura123',
            role: 'sonido',
        });
        expect(result).toMatchObject({
            ok: true,
            input: { name: 'Luis Soto', email: 'luis@navis.app', role: 'sonido' },
        });
    });

    it('editar sin tocar nada no escribe, y solo viaja lo que cambia', () => {
        expect(checkEdit(ana, userFormOf(ana))).toEqual({ ok: true, unchanged: true });
        const renamed = checkEdit(ana, { ...userFormOf(ana), name: 'Ana M. García' });
        expect(renamed).toEqual({
            ok: true,
            unchanged: false,
            update: { name: 'Ana M. García' },
            password: null,
        });
        const promoted = checkEdit(ana, { ...userFormOf(ana), role: 'sonido' });
        expect(promoted).toMatchObject({ ok: true, update: { role: 'sonido' } });
    });

    // Regresión de diseño: el correo es la sal del hash local. Sin contraseña nueva, la cuenta no volvería a entrar.
    it('cambiar el correo obliga a poner una contraseña nueva', () => {
        const values = { ...userFormOf(ana), email: 'ana.garcia@navis.app' };
        expect(emailChanged(ana, values)).toBe(true);
        expect(checkEdit(ana, values)).toMatchObject({
            ok: false,
            errors: { password: 'auth.passwordHint' },
        });
        expect(checkEdit(ana, { ...values, password: 'NuevaClave456' })).toEqual({
            ok: true,
            unchanged: false,
            update: { email: 'ana.garcia@navis.app' },
            password: 'NuevaClave456',
        });
        expect(emailChanged(ana, { ...userFormOf(ana), email: ' ANA@navis.app ' })).toBe(false);
    });
});

describe('roles que se pueden repartir', () => {
    const catalog = [
        role('creyente', 0),
        role('recepcion', 1),
        role('pastor', 2),
        role('superadmin', 3),
    ];

    it('un pastor reparte los de nivel inferior; nunca el suyo ni uno superior', () => {
        expect(assignableRoles(catalog, 'pastor').map((one) => one.slug)).toEqual([
            'creyente',
            'recepcion',
        ]);
    });

    it('el superadministrador reparte todos y quien no está en el catálogo, ninguno', () => {
        expect(assignableRoles(catalog, 'superadmin')).toHaveLength(4);
        expect(assignableRoles(catalog, 'inventado')).toEqual([]);
        expect(assignableRoles(catalog, undefined)).toEqual([]);
    });
});

describe('mensaje de cada fallo', () => {
    it('traduce los fallos conocidos y cae en el genérico con el resto', () => {
        expect(userErrorKey(new UsersError('email-taken'))).toBe('auth.emailTaken');
        expect(userErrorKey(new UsersError('role-ceiling'))).toBe('roles.roleCeilingError');
        expect(userErrorKey(new UsersError('last-admin'))).toBe('roles.lastAdmin');
        expect(userErrorKey(new UsersError('not-found'))).toBe('errors.generic');
        expect(userErrorKey(new Error('boom'))).toBe('errors.generic');
    });
});
