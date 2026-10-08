import { useState } from 'react';
import { accentHex } from '@navis/theme';
import { MAX_CUSTOM_ROLE_LEVEL, roleAccent, type Permission, type RoleRow } from '@navis/shared';

import { useRoleDisplay } from '@/hooks/use-role-display';
import { useCreateRole, useUpdateRole } from '@/hooks/use-users-mutations';
import { useThemeStore } from '@/lib/theme';
import { userErrorKey, type UserErrorKey } from '@/lib/users/user-errors';
import {
    checkCreateRole,
    checkEditRole,
    emptyRoleForm,
    roleFormOf,
    withPermission,
    type RoleFormErrors,
    type RoleFormValues,
} from '@/lib/users/role-form';

/** Los niveles que ofrece un rol propio: nunca llega al del superadministrador. */
export const ROLE_LEVELS = Array.from({ length: MAX_CUSTOM_ROLE_LEVEL + 1 }, (_, level) => level);

/**
 * El estado del formulario de un rol, para el alta (`role` ausente) y la
 * edición. Qué admite cada rol y qué ha cambiado lo decide `lib/users/role-form.ts`.
 */
export function useRoleForm(role: RoleRow | undefined, onDone: () => void) {
    const [values, setValues] = useState<RoleFormValues>(() =>
        role ? roleFormOf(role) : emptyRoleForm(),
    );
    const [errors, setErrors] = useState<RoleFormErrors>({});
    const [failure, setFailure] = useState<UserErrorKey | null>(null);
    const create = useCreateRole(),
        update = useUpdateRole(),
        display = useRoleDisplay(),
        theme = useThemeStore((state) => state.resolvedTheme);

    function change(patch: Partial<RoleFormValues>): void {
        setValues((previous) => ({ ...previous, ...patch }));
        setErrors({});
        setFailure(null);
    }

    async function save(): Promise<void> {
        setFailure(null);
        try {
            if (!role) {
                const checked = checkCreateRole(values);
                if (!checked.ok) return setErrors(checked.errors);
                await create.mutateAsync(checked.input);
                return onDone();
            }
            const checked = checkEditRole(role, values);
            if (!checked.ok) return setErrors(checked.errors);
            if (!checked.unchanged)
                await update.mutateAsync({ id: role.id, update: checked.update });
            onDone();
        } catch (error) {
            setFailure(userErrorKey(error));
        }
    }

    return {
        values,
        errors,
        failure,
        change,
        toggle: (permission: Permission, on: boolean) =>
            change({ permissions: withPermission(values, permission, on).permissions }),
        save,
        busy: create.isPending || update.isPending,
        isEdit: Boolean(role),
        // De una ficha existente, su color; de un rol nuevo, el que le tocaría por nivel.
        color: role ? display.color(role.slug) : accentHex(roleAccent(values.level), theme),
    };
}
