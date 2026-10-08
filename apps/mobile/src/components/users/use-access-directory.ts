import { useState } from 'react';

import { useLocalListViewers } from '@/hooks/use-list-viewers';
import { useLists } from '@/hooks/use-lists';
import { accessCounts, accessMatches, accessStatus } from '@/lib/users/access-status';

/**
 * El estado de la pestaña de accesos de lectura. Son los accesos de **toda la
 * iglesia** (no los de una lista): se cargan enteros, como en la web, y buscar es
 * filtrar aquí por etiqueta, usuario o nombre del creyente.
 */
export function useAccessDirectory() {
    const viewers = useLocalListViewers(),
        lists = useLists();
    const [search, setSearch] = useState(''),
        [creating, setCreating] = useState(false);
    const all = viewers.data ?? [];
    const now = new Date();
    return {
        viewers,
        lists: lists.data ?? [],
        items: all.filter((one) => accessMatches(one, search)),
        total: all.length,
        counts: accessCounts(all, now),
        statusOf: (viewer: (typeof all)[number]) => accessStatus(viewer, now),
        search,
        setSearch,
        creating,
        setCreating,
    };
}

export type AccessDirectoryState = ReturnType<typeof useAccessDirectory>;
