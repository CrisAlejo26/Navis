import type {
  CreateDreamInput,
  CreateEmotionInput,
  Dream,
  DreamAudio,
  Emotion,
  UpdateDreamInput,
  UpdateEmotionInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Todo lo de sueños se invalida junto.
 *
 * Escribir una interpretación cambia el estado de la fila, las cuentas de la
 * portada y el mapa de emociones: invalidar la raíz es más barato que acertar
 * cuál de las cuatro consultas hay que refrescar en cada caso.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.dreams.all });
}

export function useCreateDream(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateDreamInput) => api.post<Dream>('/dreams', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateDream(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateDreamInput & { id: string }) =>
      api.patch<Dream>(`/dreams/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteDream(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/dreams/${id}`),
    onSuccess: () => refresh(client),
  });
}

export function useCreateEmotion(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEmotionInput) => api.post<Emotion>('/dreams/emotions', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateEmotion(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateEmotionInput & { id: string }) =>
      api.patch<Emotion>(`/dreams/emotions/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteEmotion(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/dreams/emotions/${id}`),
    onSuccess: () => refresh(client),
  });
}

interface DreamAudioUpload {
  dreamId: string;
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
export function useUploadDreamAudio(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ dreamId, file, filename, recorded, durationSeconds }: DreamAudioUpload) => {
      const form = new FormData();
      form.append('file', file, filename);
      form.append('recorded', String(recorded));
      if (durationSeconds !== null) form.append('durationSeconds', String(durationSeconds));

      return api.post<DreamAudio>(`/dreams/${dreamId}/audios`, undefined, { body: form });
    },
    onSuccess: () => refresh(client),
  });
}

export function useDeleteDreamAudio(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (audioId: string) => api.delete<void>(`/dream-audios/${audioId}`),
    onSuccess: () => refresh(client),
  });
}
