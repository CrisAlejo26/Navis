import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

import type {
    BelieversQuery,
    NoteKind,
    Paginated,
    BelieverListItem,
    BelieversSummary,
} from '@navis/shared';

import {
    createBeliever,
    deleteBeliever,
    findBeliever,
    listBelievers,
    believersSummary,
    setCongregation,
    updateBeliever,
    type WriteBelieverInput,
} from '@/data/repos/believers-repo';
import {
    addAudio,
    createNote,
    deleteAudio,
    deleteNote,
    findNote,
    listNotes,
    noteCounts,
    noteDays,
    updateNote,
    type LocalNote,
    type WriteNoteInput,
} from '@/data/repos/notes-repo';
import { syncNotifications } from '@/lib/notifications/sync';
import { useActiveChurchId } from './use-active-church-id';
import { useLocalSession } from '@/stores/local-session';

// Hooks locales con claves de caché acotadas por iglesia.
const listKey = (churchId: string, query: BelieversQuery) =>
    ['believers', churchId, 'list', query] as const;

/** Primera carga de cincuenta, seguida de páginas de veinte. */
export const BELIEVERS_FIRST_PAGE = 50;
export const BELIEVERS_PAGE_SIZE = 20;

/** Límite y salto de cada página, con la primera más grande que el resto. */
function metadatosDePagina(pagina: number) {
    if (pagina === 1) return { limit: BELIEVERS_FIRST_PAGE, offset: 0 };
    return {
        limit: BELIEVERS_PAGE_SIZE,
        offset: BELIEVERS_FIRST_PAGE + (pagina - 2) * BELIEVERS_PAGE_SIZE,
    };
}

/** El listado, paginado en el repositorio: 50 al abrir y de 20 en 20 al hacer scroll. */
export function useBelievers(query: BelieversQuery) {
    const churchId = useActiveChurchId();
    return useInfiniteQuery({
        queryKey: listKey(churchId ?? '', query),
        queryFn: ({ pageParam }) => {
            if (!churchId) throw new Error('Sin iglesia activa no hay listado');
            const { limit, offset } = metadatosDePagina(pageParam);
            return listBelievers({ ...query, limit, offset, page: pageParam, churchId });
        },
        initialPageParam: 1,
        // La página está llena cuando devuelve justo lo que se pidió: si trae
        // menos, no hay más. Así la primera página de 50 y las de 20 coexisten.
        getNextPageParam: (last: Paginated<BelieverListItem>, _all, lastPageParam) => {
            const { limit } = metadatosDePagina(lastPageParam);
            return last.items.length >= limit ? lastPageParam + 1 : undefined;
        },
        enabled: Boolean(churchId),
    });
}

export function useBelieversSummary() {
    const churchId = useActiveChurchId();
    return useQuery({
        queryKey: ['believers', churchId, 'summary'],
        queryFn: () => {
            if (!churchId) throw new Error('Sin iglesia activa no hay resumen');
            return believersSummary(churchId);
        },
        enabled: Boolean(churchId),
    });
}

export function useBeliever(id: string) {
    const churchId = useActiveChurchId();
    return useQuery({
        queryKey: ['believers', churchId, 'one', id],
        queryFn: () => {
            if (!churchId) throw new Error('Sin iglesia activa no hay ficha');
            return findBeliever(id, churchId);
        },
        enabled: Boolean(churchId),
    });
}

/** La bitácora, de veinte en veinte con `useInfiniteQuery` (D11). */
export function useBelieverNotes(believerId: string, query: { search?: string; kind?: NoteKind }) {
    const churchId = useActiveChurchId();
    return useInfiniteQuery({
        queryKey: ['believers', churchId, 'notes', believerId, query],
        queryFn: ({ pageParam }) => {
            if (!churchId) throw new Error('Sin iglesia activa no hay bitácora');
            return listNotes(believerId, churchId, { ...query, page: pageParam });
        },
        initialPageParam: 1,
        getNextPageParam: (last: Paginated<LocalNote>) =>
            last.page < last.totalPages ? last.page + 1 : undefined,
        enabled: Boolean(churchId),
    });
}

/** Una nota concreta, para abrirla desde el aviso de su recordatorio. */
export function useNote(noteId: string | undefined) {
    const churchId = useActiveChurchId();
    return useQuery({
        queryKey: ['believers', churchId, 'note', noteId],
        queryFn: () => findNote(noteId ?? '', churchId ?? ''),
        enabled: Boolean(churchId && noteId),
    });
}

export function useNoteCounts(believerId: string) {
    const churchId = useActiveChurchId();
    return useQuery({
        queryKey: ['believers', churchId, 'noteCounts', believerId],
        queryFn: () => noteCounts(believerId, churchId ?? ''),
        enabled: Boolean(churchId),
    });
}

export function useNoteDays(believerId: string, from: string, to: string) {
    const churchId = useActiveChurchId();
    return useQuery({
        queryKey: ['believers', churchId, 'noteDays', believerId, from, to],
        queryFn: () => noteDays(believerId, from, to, churchId ?? ''),
        enabled: Boolean(churchId),
    });
}

/**
 * Tras cualquier cambio de hermanos o notas: refresca las consultas y pone los
 * avisos del teléfono al día (un recordatorio nuevo, movido, borrado o de un
 * hermano que cambió de nombre). La sincronización es idempotente y barata.
 */
function useInvalidate() {
    const client = useQueryClient();
    return () => {
        void syncNotifications();
        void client.invalidateQueries({ queryKey: ['local-lists'] });
        void client.invalidateQueries({ queryKey: ['local-tables'] });
        return client.invalidateQueries({ queryKey: ['believers'] });
    };
}

export function useCreateBeliever() {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (input: WriteBelieverInput) => {
            if (!churchId) throw new Error('Sin iglesia activa no se da de alta');
            return createBeliever(churchId, input);
        },
        onSuccess: invalidate,
    });
}

export function useUpdateBeliever() {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ id, input }: { id: string; input: Partial<WriteBelieverInput> }) => {
            if (!churchId) throw new Error('Sin iglesia activa no se guarda');
            return updateBeliever(id, churchId, input);
        },
        onSuccess: invalidate,
    });
}

export function useDeleteBeliever() {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => {
            if (!churchId) throw new Error('Sin iglesia activa no se borra');
            return deleteBeliever(id, churchId);
        },
        onSuccess: invalidate,
    });
}

export function useSetCongregation() {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({ ids, congregationId }: { ids: string[]; congregationId: string | null }) => {
            if (!churchId) throw new Error('Sin iglesia activa no hay sede que poner');
            return setCongregation(churchId, ids, congregationId);
        },
        onSuccess: invalidate,
    });
}

export function useCreateNote(believerId: string) {
    const churchId = useActiveChurchId();
    const session = useLocalSession((state) => state.session);
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (input: WriteNoteInput) => {
            if (!churchId || !session) throw new Error('Sin iglesia activa no se escribe');
            return createNote(believerId, churchId, session.userId, input);
        },
        onSuccess: invalidate,
    });
}

export function useUpdateNote(believerId: string) {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({
            id,
            input,
        }: {
            id: string;
            input: Partial<WriteNoteInput> & { remindDone?: boolean };
        }) => updateNote(id, believerId, input, churchId ?? ''),
        onSuccess: invalidate,
    });
}

export function useDeleteNote(believerId: string) {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (id: string) => deleteNote(id, believerId, churchId ?? ''),
        onSuccess: invalidate,
    });
}

export function useAddAudio(believerId: string) {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: ({
            noteId,
            audio,
        }: {
            noteId: string;
            audio: {
                sourceUri: string;
                mimeType: string;
                sizeBytes: number;
                durationSeconds: number | null;
                recorded: boolean;
            };
        }) => addAudio(noteId, audio, churchId ?? ''),
        onSuccess: invalidate,
    });
}

export function useDeleteAudio(believerId: string) {
    const churchId = useActiveChurchId();
    const invalidate = useInvalidate();
    return useMutation({
        mutationFn: (audioId: string) => deleteAudio(audioId, churchId ?? ''),
        onSuccess: invalidate,
    });
}

export type { BelieverListItem, BelieversSummary };
