import type { ListShareState, ShareListInput } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Publicar una lista y echarla a internet (RFC 0010 D8).
 *
 * Va aparte de `list-mutations` porque es otro permiso y otra decisión: editar
 * una lista y publicarla no son la misma acción, y aquí están las cuatro que
 * tocan el enlace.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.lists.all });
}

export function useShareList(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, ...input }: ShareListInput & { listId: string }) =>
      api.post<ListShareState>(`/lists/${listId}/share`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

/** Mantiene la lista publicada y el modo: solo tira el token viejo (D11). */
export function useRotateListLink(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => api.post<ListShareState>(`/lists/${listId}/share/rotate`),
    onSuccess: () => refresh(client),
  });
}

export function useUnshareList(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) => api.delete<ListShareState>(`/lists/${listId}/share`),
    onSuccess: () => refresh(client),
  });
}

/**
 * La portada de la tarjeta, que compone y rasteriza el navegador (D18).
 *
 * Va por `FormData` y **sin** `content-type` puesto a mano: el navegador tiene
 * que escribirlo él para incluir el `boundary` del multipart.
 */
export function useUploadListCover(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, file }: { listId: string; file: Blob }) => {
      const form = new FormData();
      form.append('file', file, 'cover.png');

      return api.post<void>(`/lists/${listId}/cover`, undefined, { body: form });
    },
    onSuccess: () => refresh(client),
  });
}
