import type {
  CreateListViewerInput,
  ListCredential,
  ListCredentialSheetRow,
  ListViewer,
  UpdateListViewerInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Los accesos y sus concesiones (RFC 0010 D19).
 *
 * Se invalida la raíz de listas entera porque las dos cosas se miran de los dos
 * lados: el directorio dice a cuántas listas llega cada acceso, y la pestaña de
 * compartir de cada lista dice quién entra en ella.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.lists.all });
}

/** **Devuelve la contraseña en claro, una sola vez**: cópiala o piérdela (D24). */
export function useCreateListViewer(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateListViewerInput) =>
      api.post<ListCredential>('/list-viewers', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateListViewer(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateListViewerInput & { id: string }) =>
      api.patch<ListViewer>(`/list-viewers/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

/** Regenerar echa fuera al momento a quien esté dentro (D28). */
export function useRegenerateListPassword(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.post<ListCredential>(`/list-viewers/${id}/password`, { password }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteListViewer(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/list-viewers/${id}`),
    onSuccess: () => refresh(client),
  });
}

/** A qué listas llega este acceso. Marcar cuatro casillas, no cuatro usuarios. */
export function useSetViewerLists(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ids }: { id: string; ids: string[] }) =>
      api.put<ListViewer>(`/list-viewers/${id}/lists`, { ids }),
    onSuccess: () => refresh(client),
  });
}

/** Lo mismo del otro lado: quién entra en esta lista. */
export function useSetListViewers(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, ids }: { listId: string; ids: string[] }) =>
      api.put<ListViewer[]>(`/lists/${listId}/viewers`, { ids }),
    onSuccess: () => refresh(client),
  });
}

/** «Dar acceso a los de esta lista»: crea solo los que faltan y da su hoja (D29). */
export function useBulkGrantList(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (listId: string) =>
      api.post<ListCredentialSheetRow[]>(`/lists/${listId}/viewers/bulk`),
    onSuccess: () => refresh(client),
  });
}
