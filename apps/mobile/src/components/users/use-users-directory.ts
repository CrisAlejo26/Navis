import { useState } from 'react';

import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useListContext } from '@/hooks/use-lists';
import { useRoleDisplay } from '@/hooks/use-role-display';
import { useAccountsTotal, useUserPermissions, useUsersPages } from '@/hooks/use-users';

/** El estado de la pantalla de usuarios: filtros, páginas cargadas y lo que hace falta para pintarlas. */
export function useUsersDirectory() {
    const scope = useListContext(),
        roles = useRoleDisplay(),
        total = useAccountsTotal(),
        permissions = useUserPermissions();
    const [search, setSearch] = useState(''),
        [role, setRole] = useState<string | null>(null),
        [creating, setCreating] = useState(false);
    const typed = useDebouncedValue(search),
        filters = { search: typed.trim(), role },
        pages = useUsersPages(filters);
    const items = pages.data?.pages.flatMap((page) => page.items) ?? [];
    return {
        scope,
        roles,
        total: total.data ?? 0,
        canCreate: permissions.canManage,
        creating,
        setCreating,
        search,
        setSearch,
        role,
        setRole,
        pages,
        items,
        filtered: filters.search !== '' || role !== null,
        clear: () => {
            setSearch('');
            setRole(null);
        },
    };
}

export type UsersDirectoryState = ReturnType<typeof useUsersDirectory>;
