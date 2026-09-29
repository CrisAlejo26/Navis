import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
    CreateTeachingInput,
    Paginated,
    TeachingListItem,
    TeachingsQuery,
    UpdateTeachingInput,
} from '@navis/shared';

import {
    createTeaching,
    deleteTeaching,
    findTeaching,
    listTeachings,
    teachingsStats,
    updateTeaching,
} from '@/data/repos/teachings-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * Los hooks de enseñanzas **en local** (docs/planes/pendientes/ensenanzas-movil-plan.md
 * §4.3): la pantalla no sabe que los datos vienen de SQLite. Todo cuelga de
 * `['teachings', ownerId]`, para invalidar lista, cuentas y ficha juntas.
 */

const PAGE_SIZE = 20;

export function useTeachings(query: TeachingsQuery) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useInfiniteQuery({
        queryKey: ['teachings', ownerId, 'list', query],
        queryFn: ({ pageParam }) => {
            if (!ownerId) throw new Error('Sin sesión no hay listado');
            return listTeachings(ownerId, { ...query, page: pageParam, limit: PAGE_SIZE });
        },
        initialPageParam: 1,
        getNextPageParam: (last: Paginated<TeachingListItem>) =>
            last.page < last.totalPages ? last.page + 1 : undefined,
        enabled: Boolean(ownerId),
    });
}

export function useTeachingsStats() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['teachings', ownerId, 'stats'],
        queryFn: () => {
            if (!ownerId) throw new Error('Sin sesión no hay cuentas');
            return teachingsStats(ownerId);
        },
        enabled: Boolean(ownerId),
    });
}

export function useTeaching(id: string | undefined) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['teachings', ownerId, 'detail', id],
        queryFn: () => {
            if (!ownerId || !id) throw new Error('Sin sesión no hay ficha');
            return findTeaching(ownerId, id);
        },
        enabled: Boolean(ownerId && id),
    });
}

function useInvalidate() {
    const client = useQueryClient();
    const ownerId = useLocalSession((state) => state.session?.userId);
    return () => client.invalidateQueries({ queryKey: ['teachings', ownerId] });
}

export function useCreateTeaching() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (input: CreateTeachingInput) => {
            if (!ownerId) throw new Error('Sin sesión no se apunta nada');
            return createTeaching(ownerId, input);
        },
        onSuccess: invalidate,
    });
}

export function useUpdateTeaching() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateTeachingInput }) => {
            if (!ownerId) throw new Error('Sin sesión no se guarda');
            return updateTeaching(ownerId, id, input);
        },
        onSuccess: invalidate,
    });
}

export function useDeleteTeaching() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => {
            if (!ownerId) throw new Error('Sin sesión no se borra');
            return deleteTeaching(ownerId, id);
        },
        onSuccess: invalidate,
    });
}
