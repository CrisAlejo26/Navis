import { useState } from 'react';

import { useRoleDisplay } from '@/hooks/use-role-display';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useUser, useUsersAsker } from '@/hooks/use-users';

export type UserDialog = 'edit' | 'password' | 'delete';

/** Lo que pinta la ficha de una cuenta: la cuenta, su rol y qué se puede hacer con ella. */
export function useUserDetail(id: string) {
    const user = useUser(id),
        display = useRoleDisplay(),
        permissions = useUserPermissions(),
        { asker } = useUsersAsker();
    const [dialog, setDialog] = useState<UserDialog | null>(null);
    const isMe = id === asker.userId;
    return {
        user,
        display,
        isMe,
        // Sobre la propia cuenta no se actúa desde aquí: se edita desde el perfil (la API lo prohíbe igual).
        canAct: permissions.canManage && !isMe,
        dialog,
        setDialog,
    };
}
