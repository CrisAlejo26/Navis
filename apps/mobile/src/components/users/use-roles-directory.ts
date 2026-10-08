import { useState } from 'react';

import { useRoleDisplay } from '@/hooks/use-role-display';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import { useRoleCatalog } from '@/hooks/use-users';

/**
 * El estado de la pestaña de roles. El catálogo entero ya está en memoria (son
 * pocas filas, como en la web), así que buscar es filtrar aquí y no pedir nada.
 * Los de serie no guardan nombre —se traducen—, por eso se busca por el nombre
 * que se ve y no por el que hay en la base.
 */
export function useRolesDirectory() {
    const display = useRoleDisplay(),
        catalog = useRoleCatalog(),
        permissions = useUserPermissions();
    const [search, setSearch] = useState(''),
        [creating, setCreating] = useState(false);
    const term = search.trim().toLowerCase();
    // De más a menos alcance: arriba lo que más puede, y a igual nivel, por nombre.
    const items = [...(catalog.data ?? [])]
        .filter((role) => term === '' || display.label(role.slug).toLowerCase().includes(term))
        .sort(
            (a, b) =>
                b.level - a.level || display.label(a.slug).localeCompare(display.label(b.slug)),
        );
    return {
        display,
        catalog,
        items,
        total: catalog.data?.length ?? 0,
        canCreate: permissions.canManageRoles,
        search,
        setSearch,
        creating,
        setCreating,
    };
}

export type RolesDirectoryState = ReturnType<typeof useRolesDirectory>;
