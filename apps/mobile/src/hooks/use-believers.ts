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
  listNotes,
  noteCounts,
  noteDays,
  updateNote,
  type LocalNote,
  type WriteNoteInput,
} from '@/data/repos/notes-repo';
import { useLocalSession } from '@/stores/local-session';

/**
 * Los hooks de creyentes **en local**: la pantalla no sabe que los datos
 * vienen de SQLite —esa frontera vive en `src/data/repos/`— y las claves
 * cuelgan todas de `['believers', churchId]` para invalidarlas juntas, como
 * hace `refreshBelievers` en el cliente de la API.
 */

const listKey = (churchId: string, query: BelieversQuery) =>
  ['believers', churchId, 'list', query] as const;

/** El listado, de veinte en veinte: la paginación la hace el repositorio. */
export function useBelievers(query: BelieversQuery) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  return useInfiniteQuery({
    queryKey: listKey(churchId ?? '', query),
    queryFn: ({ pageParam }) => {
      if (!churchId) throw new Error('Sin iglesia activa no hay listado');
      return listBelievers({ ...query, page: pageParam, churchId });
    },
    initialPageParam: 1,
    getNextPageParam: (last: Paginated<BelieverListItem>) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: Boolean(churchId),
  });
}

export function useBelieversSummary() {
  const churchId = useLocalSession((state) => state.session?.churchId);
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
  const churchId = useLocalSession((state) => state.session?.churchId);
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
  const churchId = useLocalSession((state) => state.session?.churchId);
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

export function useNoteCounts(believerId: string) {
  return useQuery({
    queryKey: ['believers', 'noteCounts', believerId],
    queryFn: () => noteCounts(believerId),
  });
}

export function useNoteDays(believerId: string, from: string, to: string) {
  return useQuery({
    queryKey: ['believers', 'noteDays', believerId, from, to],
    queryFn: () => noteDays(believerId, from, to),
  });
}

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['believers'] });
}

export function useCreateBeliever() {
  const churchId = useLocalSession((state) => state.session?.churchId);
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
  const churchId = useLocalSession((state) => state.session?.churchId);
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
  const churchId = useLocalSession((state) => state.session?.churchId);
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
  const churchId = useLocalSession((state) => state.session?.churchId);
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
  const session = useLocalSession((state) => state.session);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: WriteNoteInput) => {
      if (!session?.churchId) throw new Error('Sin iglesia activa no se escribe');
      return createNote(believerId, session.churchId, session.userId, input);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateNote(believerId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<WriteNoteInput> & { remindDone?: boolean };
    }) => updateNote(id, believerId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteNote(believerId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteNote(id, believerId),
    onSuccess: invalidate,
  });
}

export function useAddAudio(believerId: string) {
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
    }) => addAudio(noteId, audio),
    onSuccess: invalidate,
  });
}

export function useDeleteAudio(believerId: string) {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (audioId: string) => deleteAudio(audioId),
    onSuccess: invalidate,
  });
}

export type { BelieverListItem, BelieversSummary };
