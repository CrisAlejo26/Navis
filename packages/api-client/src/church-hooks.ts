import type { Church, CreateChurchInput, MyChurches, UpdateChurchInput } from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Las iglesias de la cuenta y en cuál está trabajando (RFC 0008).
 *
 * Es de las primeras consultas de la aplicación: de ella depende si hay que
 * pedir la primera iglesia antes de dejar entrar a ninguna pantalla.
 */
export function useMyChurches(api: ApiClient, enabled = true): UseQueryResult<MyChurches> {
  return useQuery({
    queryKey: queryKeys.churches.mine,
    queryFn: () => api.get<MyChurches>('/churches'),
    enabled,
    staleTime: 60_000,
  });
}

export function useCreateChurch(api: ApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateChurchInput) => api.post<Church>('/churches', { ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.churches.all }),
  });
}

export function useUpdateChurch(api: ApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateChurchInput & { id: string }) =>
      api.patch<Church>(`/churches/${id}`, { ...input }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.churches.all }),
  });
}

/**
 * Cambia la iglesia activa. Al terminar se invalida **todo**, no solo la lista:
 * lo que había en pantalla era de la iglesia anterior.
 */
export function useSetActiveChurch(api: ApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (churchId: string) => api.put<MyChurches>('/churches/active', { churchId }),
    onSuccess: (churches) => {
      queryClient.setQueryData(queryKeys.churches.mine, churches);
      return queryClient.invalidateQueries();
    },
  });
}
