import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type {
    CreateDreamInput,
    DreamListItem,
    DreamsQuery,
    Paginated,
    UpdateDreamInput,
} from '@navis/shared';

import {
    addDreamAudio,
    deleteDreamAudio,
    type WriteDreamAudioInput,
} from '@/data/repos/dream-audios-repo';
import {
    createDream,
    deleteDream,
    dreamsStats,
    findDream,
    listDreams,
    updateDream,
} from '@/data/repos/dreams-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * Los hooks de sueños **en local** (docs/planes/pendientes/suenos-movil-plan.md §3.4):
 * la pantalla no sabe que los datos vienen de SQLite. Todo cuelga de
 * `['dreams', ownerId]`, para invalidar lista, cuentas y ficha juntas.
 */

const PAGE_SIZE = 20;

export function useDreams(query: DreamsQuery) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useInfiniteQuery({
        queryKey: ['dreams', ownerId, 'list', query],
        queryFn: ({ pageParam }) => {
            if (!ownerId) throw new Error('Sin sesión no hay listado');
            return listDreams(ownerId, { ...query, page: pageParam, limit: PAGE_SIZE });
        },
        initialPageParam: 1,
        getNextPageParam: (last: Paginated<DreamListItem>) =>
            last.page < last.totalPages ? last.page + 1 : undefined,
        enabled: Boolean(ownerId),
    });
}

export function useDreamsStats() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['dreams', ownerId, 'stats'],
        queryFn: () => {
            if (!ownerId) throw new Error('Sin sesión no hay cuentas');
            return dreamsStats(ownerId);
        },
        enabled: Boolean(ownerId),
    });
}

export function useDream(id: string) {
    const ownerId = useLocalSession((state) => state.session?.userId);
    return useQuery({
        queryKey: ['dreams', ownerId, 'detail', id],
        queryFn: () => {
            if (!ownerId) throw new Error('Sin sesión no hay ficha');
            return findDream(ownerId, id);
        },
        enabled: Boolean(ownerId),
    });
}

/** Lo que cuelga de `['dreams', ownerId]` y también el vocabulario: sus cuentas cambian con cada sueño. */
function useInvalidate() {
    const client = useQueryClient();
    const ownerId = useLocalSession((state) => state.session?.userId);
    return () =>
        Promise.all([
            client.invalidateQueries({ queryKey: ['dreams', ownerId] }),
            client.invalidateQueries({ queryKey: ['emotions', ownerId] }),
        ]);
}

export function useCreateDream() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (input: CreateDreamInput) => {
            if (!ownerId) throw new Error('Sin sesión no se apunta nada');
            return createDream(ownerId, input);
        },
        onSuccess: invalidate,
    });
}

export function useUpdateDream() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: UpdateDreamInput }) => {
            if (!ownerId) throw new Error('Sin sesión no se guarda');
            return updateDream(ownerId, id, input);
        },
        onSuccess: invalidate,
    });
}

export function useDeleteDream() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => {
            if (!ownerId) throw new Error('Sin sesión no se borra');
            return deleteDream(ownerId, id);
        },
        onSuccess: invalidate,
    });
}

export function useAddDreamAudio() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ dreamId, audio }: { dreamId: string; audio: WriteDreamAudioInput }) => {
            if (!ownerId) throw new Error('Sin sesión no se adjunta nada');
            return addDreamAudio(ownerId, dreamId, audio);
        },
        onSuccess: invalidate,
    });
}

export function useDeleteDreamAudio() {
    const ownerId = useLocalSession((state) => state.session?.userId);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (audioId: string) => {
            if (!ownerId) throw new Error('Sin sesión no se borra');
            return deleteDreamAudio(ownerId, audioId);
        },
        onSuccess: invalidate,
    });
}
