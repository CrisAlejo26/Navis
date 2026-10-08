import { useState } from 'react';

import { useRole } from '@/hooks/use-role';
import { useRoleDisplay } from '@/hooks/use-role-display';
import { useUserPermissions } from '@/hooks/use-user-permissions';

export type RoleDialog = 'edit' | 'delete';

/** Lo que pinta la ficha de un rol: el rol, cómo se ve y qué se puede hacer con él. */
export function useRoleDetail(id: string) {
    const { catalog, role } = useRole(id),
        display = useRoleDisplay(),
        permissions = useUserPermissions();
    const [dialog, setDialog] = useState<RoleDialog | null>(null);
    return {
        catalog,
        role,
        display,
        canEdit: permissions.canManageRoles,
        // Los de serie no se borran; uno propio con cuentas tampoco, pero se enseña por qué.
        canDelete: permissions.canManageRoles && role !== undefined && !role.isSystem,
        dialog,
        setDialog,
    };
}
