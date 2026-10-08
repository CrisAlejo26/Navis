import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
    hasPermission,
    managedUsersQuerySchema,
    rolesQuerySchema,
    type ManagedUser,
    type MyRole,
    type RoleRow,
} from '@navis/shared';

import { usersGateway } from '@/data/users/gateway';
import type { Asker } from '@/data/users/users-gateway';
import { useListContext } from './use-lists';

/** Lo que se pide de una página de cuentas; el servidor remoto aceptará lo mismo. */
export interface UsersFilters {
    search: string;
    role: string | null;
}

const PAGE_SIZE = 20;

export const usersKey = (asker: Asker) => ['local-users', asker.churchId, asker.userId] as const;

/** Quien pregunta y si ya hay iglesia y sesión: el alcance de todo lo demás. */
export function useUsersAsker(): { asker: Asker; enabled: boolean } {
    const { context, enabled } = useListContext();
    return { asker: context, enabled };
}

export function useUsersPages(filters: UsersFilters) {
    const { asker, enabled } = useUsersAsker();
    return useInfiniteQuery({
        queryKey: [...usersKey(asker), 'list', filters],
        queryFn: ({ pageParam }) =>
            usersGateway.listUsers(
                asker,
                managedUsersQuerySchema.parse({
                    page: pageParam,
                    limit: PAGE_SIZE,
                    search: filters.search || undefined,
                    role: filters.role ?? undefined,
                    sort: 'name',
                    order: 'asc',
                }),
            ),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
        // Al filtrar se siguen viendo las filas de antes hasta que llegan las nuevas: sin esto
        // la lista se vacía y parpadea el esqueleto en cada letra.
        placeholderData: keepPreviousData,
        enabled,
    });
}

/** Cuántas cuentas hay en total, sin filtros: es la cifra grande de la cabecera. */
export function useAccountsTotal() {
    const { asker, enabled } = useUsersAsker();
    return useQuery({
        queryKey: [...usersKey(asker), 'total'],
        queryFn: async () =>
            (
                await usersGateway.listUsers(
                    asker,
                    managedUsersQuerySchema.parse({ page: 1, limit: 1 }),
                )
            ).total,
        enabled,
    });
}

export function useRoleCatalog() {
    const { asker, enabled } = useUsersAsker();
    return useQuery({
        queryKey: [...usersKey(asker), 'roles'],
        queryFn: async (): Promise<RoleRow[]> =>
            (
                await usersGateway.listRoles(
                    asker,
                    rolesQuerySchema.parse({ page: 1, limit: 100, sort: 'level', order: 'asc' }),
                )
            ).items,
        enabled,
    });
}

export function useMyRole() {
    const { asker, enabled } = useUsersAsker();
    return useQuery({
        queryKey: [...usersKey(asker), 'mine'],
        queryFn: (): Promise<MyRole> => usersGateway.myRole(asker),
        enabled,
    });
}

export type { ManagedUser };

/** Una cuenta por id, para su ficha. */
export function useUser(id: string) {
    const { asker, enabled } = useUsersAsker();
    return useQuery({
        queryKey: [...usersKey(asker), 'one', id],
        queryFn: () => usersGateway.getUser(asker, id),
        enabled: enabled && Boolean(id),
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
    };
}
