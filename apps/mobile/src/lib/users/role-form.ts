import {
    SUPERADMIN_ROLE,
    createRoleSchema,
    isPermission,
    type CreateRoleInput,
    type Permission,
    type RoleRow,
    type UpdateRoleInput,
} from '@navis/shared';

export interface RoleFormValues {
    name: string;
    description: string;
    level: number;
    permissions: Permission[];
}

/** Clave de traducción, nunca el texto: el del esquema zod está en español (Regla 2 §6). */
export type RoleFormErrors = { name?: 'roles.fieldRoleName' };

export function emptyRoleForm(): RoleFormValues {
    return { name: '', description: '', level: 0, permissions: [] };
}

/** Los permisos que ya no existen en el catálogo no se pintan ni se reenvían: no conceden nada. */
export function roleFormOf(role: RoleRow): RoleFormValues {
    return {
        name: role.name ?? '',
        description: role.description ?? '',
        level: role.level,
        permissions: role.permissions.filter(isPermission),
    };
}

export function withPermission(
    values: RoleFormValues,
    permission: Permission,
    on: boolean,
): RoleFormValues {
    const rest = values.permissions.filter((one) => one !== permission);
    return { ...values, permissions: on ? [...rest, permission] : rest };
}

export type RoleCreateCheck =
    { ok: true; input: CreateRoleInput } | { ok: false; errors: RoleFormErrors };

export function checkCreateRole(values: RoleFormValues): RoleCreateCheck {
    const parsed = createRoleSchema.safeParse({
        name: values.name,
        description: values.description.trim() || undefined,
        level: values.level,
        permissions: values.permissions,
    });
    if (!parsed.success) return { ok: false, errors: { name: 'roles.fieldRoleName' } };
    return { ok: true, input: parsed.data };
}

export type RoleEditCheck =
    | { ok: true; unchanged: true }
    | { ok: true; unchanged: false; update: UpdateRoleInput }
    | { ok: false; errors: RoleFormErrors };

const sameSet = (a: readonly string[], b: readonly string[]) =>
    a.length === b.length && a.every((one) => b.includes(one));

/**
 * Solo viaja lo que cambia, y solo lo que ese rol admite: de uno de serie no se
 * tocan ni el nombre —se traduce— ni el nivel, y del superadministrador, ni los
 * permisos (quitarle el comodín dejaría la instalación sin quien lo devuelva).
 */
export function checkEditRole(role: RoleRow, values: RoleFormValues): RoleEditCheck {
    const original = roleFormOf(role);
    const update: UpdateRoleInput = {};
    if (!role.isSystem) {
        if (values.name.trim().length < 2)
            return { ok: false, errors: { name: 'roles.fieldRoleName' } };
        if (values.name.trim() !== original.name) update.name = values.name.trim();
        if (values.level !== original.level) update.level = values.level;
    }
    if (values.description.trim() !== original.description)
        update.description = values.description.trim() || null;
    if (role.slug !== SUPERADMIN_ROLE && !sameSet(values.permissions, original.permissions))
        update.permissions = values.permissions;
    if (Object.keys(update).length === 0) return { ok: true, unchanged: true };
    return { ok: true, unchanged: false, update };
}
