import type {
  BelieverNote,
  CreateNoteInput,
  NoteAudio,
  NoteCounts,
  NoteDay,
  NoteKind,
  Paginated,
  UpdateNoteInput,
} from '@navis/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseInfiniteQueryResult,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Lo que devuelve la bitácora: la página y las cuentas por tipo. */
export type NotesPage = Paginated<BelieverNote> & { counts: NoteCounts };

/** De veinte en veinte: la bitácora se lee hacia atrás con «Ver más» (D11). */
export const NOTES_PAGE_SIZE = 20;

export interface NotesQuery {
  kind?: NoteKind;
  /** Texto libre. Se resuelve en el servidor, porque la bitácora se pagina. */
  search?: string;
}

/**
 * La bitácora de un hermano.
 *
 * `useInfiniteQuery` y no scroll infinito: quien pulsa «Ver más» decide cuándo
 * cargar, y eso funciona con teclado, que un observador de scroll no (D11).
 */
export function useBelieverNotes(
  api: ApiClient,
  believerId: string,
  query: NotesQuery = {},
): UseInfiniteQueryResult<{ pages: NotesPage[] }> {
  return useInfiniteQuery({
    queryKey: queryKeys.believers.notes(believerId, query),
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: String(NOTES_PAGE_SIZE),
      });
      if (query.kind) params.set('kind', query.kind);
      if (query.search) params.set('search', query.search);

      return api.get<NotesPage>(`/believers/${believerId}/notes?${params.toString()}`);
    },
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    enabled: Boolean(believerId),
    staleTime: 30_000,
  });
}

/**
 * Qué días tienen notas, para la vista de calendario.
 *
 * Va aparte del listado porque es otro dato: aquí no viaja el texto, solo el
 * día y de qué fue. Un año son 365 filas como mucho y no hace falta paginar.
 */
export function useNoteDays(
  api: ApiClient,
  believerId: string,
  range: { from: string; to: string },
  enabled = true,
): UseQueryResult<NoteDay[]> {
  return useQuery({
    queryKey: queryKeys.believers.noteDays(believerId, range),
    queryFn: () =>
      api.get<NoteDay[]>(`/believers/${believerId}/notes/days?from=${range.from}&to=${range.to}`),
    enabled: enabled && Boolean(believerId),
    staleTime: 30_000,
  });
}

/**
 * Escribir una nota mueve más cosas que la bitácora: la sonda de esa persona,
 * su fila del listado y las cuentas de la cabecera. Se invalida la raíz entera.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.believers.all });
}

export function useCreateNote(api: ApiClient, believerId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateNoteInput) =>
      api.post<BelieverNote>(`/believers/${believerId}/notes`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateNote(api: ApiClient, believerId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateNoteInput & { id: string }) =>
      api.patch<BelieverNote>(`/believers/${believerId}/notes/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteNote(api: ApiClient, believerId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/believers/${believerId}/notes/${id}`),
    onSuccess: () => refresh(client),
  });
}

export interface AudioUpload {
  noteId: string;
  file: Blob;
  /** El nombre solo viaja para el `multipart`; el servidor pone el suyo. */
  filename: string;
  recorded: boolean;
  durationSeconds: number | null;
}

/**
 * Subir un audio va por `FormData` y **sin** `content-type` puesto a mano: el
 * navegador tiene que escribirlo él para incluir el `boundary` del multipart.
 * Por eso no usa `api.post`, que serializa JSON.
 */
export function useUploadNoteAudio(api: ApiClient, believerId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, file, filename, recorded, durationSeconds }: AudioUpload) => {
      const form = new FormData();
      form.append('file', file, filename);
      form.append('recorded', String(recorded));
      if (durationSeconds !== null) form.append('durationSeconds', String(durationSeconds));

      return api.post<NoteAudio>(`/believers/${believerId}/notes/${noteId}/audios`, undefined, {
        body: form,
      });
    },
    onSuccess: () => refresh(client),
  });
}

export function useDeleteNoteAudio(api: ApiClient, believerId: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ noteId, audioId }: { noteId: string; audioId: string }) =>
      api.delete<void>(`/believers/${believerId}/notes/${noteId}/audios/${audioId}`),
    onSuccess: () => refresh(client),
  });
}
