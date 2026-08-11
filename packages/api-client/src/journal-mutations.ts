import type {
  CreateEntryInput,
  JournalEntry,
  JournalEntryAudio,
  UpdateEntryInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Todo lo del cuaderno se invalida junto.
 *
 * Guardar una entrada cambia la fila del listado, las cuentas de la portada y
 * el gráfico mensual: invalidar la raíz es más barato que acertar cuál de las
 * tres consultas hay que refrescar en cada caso.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.journal.all });
}

export function useCreateEntry(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEntryInput) => api.post<JournalEntry>('/journal', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateEntry(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEntryInput & { id: string }) =>
      api.patch<JournalEntry>(`/journal/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteEntry(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/journal/${id}`),
    onSuccess: () => refresh(client),
  });
}

interface EntryAudioUpload {
  entryId: string;
  file: Blob;
  /** El nombre solo viaja para el `multipart`; el servidor pone el suyo. */
  filename: string;
  recorded: boolean;
  durationSeconds: number | null;
}

/**
 * Subir un audio va por `FormData` y **sin** `content-type` puesto a mano: el
 * navegador tiene que escribirlo él para incluir el `boundary` del multipart.
 * Por eso no usa `api.post` con un objeto, que serializa JSON.
 */
export function useUploadEntryAudio(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, file, filename, recorded, durationSeconds }: EntryAudioUpload) => {
      const form = new FormData();
      form.append('file', file, filename);
      form.append('recorded', String(recorded));
      if (durationSeconds !== null) form.append('durationSeconds', String(durationSeconds));

      return api.post<JournalEntryAudio>(`/journal/${entryId}/audios`, undefined, { body: form });
    },
    onSuccess: () => refresh(client),
  });
}

export function useDeleteEntryAudio(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, audioId }: { entryId: string; audioId: string }) =>
      api.delete<void>(`/journal/${entryId}/audios/${audioId}`),
    onSuccess: () => refresh(client),
  });
}
