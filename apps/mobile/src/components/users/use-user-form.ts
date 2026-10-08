import { useState } from 'react';
import type { ManagedUser } from '@navis/shared';

import { useRoleDisplay } from '@/hooks/use-role-display';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useCreateUser, useSetUserPassword, useUpdateUser } from '@/hooks/use-users-mutations';
import { assignableRoles } from '@/lib/users/assignable-roles';
import { userErrorKey, type UserErrorKey } from '@/lib/users/user-errors';
import {
    checkCreate,
    checkEdit,
    emailChanged,
    emptyUserForm,
    userFormOf,
    type UserFormErrors,
    type UserFormValues,
} from '@/lib/users/user-form';

/**
 * El estado del formulario de una cuenta, para el alta (`user` ausente) y para
 * la edición. Las reglas —qué falta, qué ha cambiado, cuándo hace falta una
 * contraseña nueva— viven en `lib/users/user-form.ts`; esto solo las ata a los
 * hooks de escritura y a lo que se muestra.
 */
export function useUserForm(user: ManagedUser | undefined, onDone: () => void) {
    const [values, setValues] = useState<UserFormValues>(() =>
        user ? userFormOf(user) : emptyUserForm(),
    );
    const [errors, setErrors] = useState<UserFormErrors>({});
    const [failure, setFailure] = useState<UserErrorKey | null>(null);
    const create = useCreateUser(),
        update = useUpdateUser(),
        setPassword = useSetUserPassword();
    const display = useRoleDisplay(),
        mine = useUserPermissions();
    // La edición conserva el rol actual como opción aunque quede por encima del tope: se ve, y solo viaja si cambia.
    const options = assignableRoles(display.roles, mine.slug).filter(
        (role) => role.slug !== user?.role,
    );
    const current = display.roles.filter((role) => role.slug === user?.role);

    function change(patch: Partial<UserFormValues>): void {
        setValues((previous) => ({ ...previous, ...patch }));
        setErrors({});
        setFailure(null);
    }

    async function save(): Promise<void> {
        setFailure(null);
        try {
            if (!user) {
                const checked = checkCreate(values);
                if (!checked.ok) return setErrors(checked.errors);
                await create.mutateAsync(checked.input);
                return onDone();
            }
            const checked = checkEdit(user, values);
            if (!checked.ok) return setErrors(checked.errors);
            if (checked.unchanged) return onDone();
            await update.mutateAsync({ id: user.id, update: checked.update });
            if (checked.password)
                await setPassword.mutateAsync({ id: user.id, password: checked.password });
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
        save,
        busy: create.isPending || update.isPending || setPassword.isPending,
        roleOptions: [...current, ...options],
        display,
        needsPassword: !user || emailChanged(user, values),
        isEdit: Boolean(user),
    };
}
