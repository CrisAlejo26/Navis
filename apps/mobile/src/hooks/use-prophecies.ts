import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
    CreateFulfillmentInput,
    CreateProphecyInput,
    Paginated,
    PropheciesQuery,
    ProphecyListItem,
    UpdateFulfillmentInput,
    UpdateProphecyInput,
} from '@navis/shared';

import {
    createProphecy,
    deleteProphecy,
    findProphecy,
    listProphecies,
    prophecyStats,
    updateProphecy,
} from '@/data/repos/prophecies-repo';
import {
    addFulfillment,
    deleteFulfillment,
    updateFulfillment,
} from '@/data/repos/prophecy-fulfillments-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * Los hooks de profecías **en local** (docs/planes/implementados/profecias-movil-plan.md §4.4): la
 * pantalla no sabe que los datos vienen de SQLite. Todo cuelga de
 * `['prophecies', ownerId]`, para invalidar lista, cuentas y ficha juntas.
 */

const PAGE_SIZE = 20;

export function useProphecies(query: PropheciesQuery) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useInfiniteQuery({
        queryKey: ['prophecies', ownerId, 'list', query],
        queryFn: ({ pageParam }) => {
            if (!ownerId) throw new Error('Sin sesión no hay listado');
            return listProphecies(ownerId, { ...query, page: pageParam, limit: PAGE_SIZE });
        },
        initialPageParam: 1,
        getNextPageParam: (last: Paginated<ProphecyListItem>) =>
            last.page < last.totalPages ? last.page + 1 : undefined,
        enabled: Boolean(ownerId),
    });
}

export function useProphecyStats() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['prophecies', ownerId, 'stats'],
        queryFn: () => {
            if (!ownerId) throw new Error('Sin sesión no hay cuentas');
            return prophecyStats(ownerId);
        },
        enabled: Boolean(ownerId),
    });
}

export function useProphecy(id: string) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['prophecies', ownerId, 'detail', id],
        queryFn: () => {
            if (!ownerId) throw new Error('Sin sesión no hay ficha');
            return findProphecy(ownerId, id);
        },
        enabled: Boolean(ownerId),
    });
}

function useInvalidate() {
    const client = useQueryClient();
    const ownerId = useLocalSession((state) => state.session?.userId);
    return () => client.invalidateQueries({ queryKey: ['prophecies', ownerId] });
}

export function useCreateProphecy() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (input: CreateProphecyInput) => {
            if (!ownerId) throw new Error('Sin sesión no se apunta nada');
            return createProphecy(ownerId, input);
        },
        onSuccess: invalidate,
    });
}

export function useUpdateProphecy() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateProphecyInput }) => {
            if (!ownerId) throw new Error('Sin sesión no se guarda');
            return updateProphecy(ownerId, id, input);
        },
        onSuccess: invalidate,
    });
}

export function useDeleteProphecy() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => {
            if (!ownerId) throw new Error('Sin sesión no se borra');
            return deleteProphecy(ownerId, id);
        },
        onSuccess: invalidate,
    });
}

export function useAddFulfillment(prophecyId: string) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (input: CreateFulfillmentInput) => {
            if (!ownerId) throw new Error('Sin sesión no se anota nada');
            return addFulfillment(ownerId, prophecyId, input);
        },
        onSuccess: invalidate,
    });
}

export function useUpdateFulfillment(prophecyId: string) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateFulfillmentInput }) => {
            if (!ownerId) throw new Error('Sin sesión no se guarda');
            return updateFulfillment(ownerId, prophecyId, id, input);
        },
        onSuccess: invalidate,
    });
}

export function useDeleteFulfillment(prophecyId: string) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => {
            if (!ownerId) throw new Error('Sin sesión no se borra');
            return deleteFulfillment(ownerId, prophecyId, id);
        },
        onSuccess: invalidate,
    });
}
