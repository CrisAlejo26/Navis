import { useQuery } from '@tanstack/react-query';
import { hasPermission, type MyRole } from '@navis/shared';

import { usersGateway } from '@/data/users/gateway';
import { usersKey, useUsersAsker } from './use-users';

export function useMyRole() {
    const { asker, enabled } = useUsersAsker();
    return useQuery({
        queryKey: [...usersKey(asker), 'mine'],
        queryFn: (): Promise<MyRole> => usersGateway.myRole(asker),
        enabled,
    });
}

/** Qué puede hacer quien ha entrado: la interfaz oculta lo que el puerto rechazaría. */
export function useUserPermissions() {
    const mine = useMyRole();
    const granted = mine.data?.permissions ?? [];
    return {
        slug: mine.data?.slug,
        canManage: hasPermission(granted, 'users.manage'),
        canManageRoles: hasPermission(granted, 'roles.manage'),
        canShareLists: hasPermission(granted, 'lists.share'),
    };
}
