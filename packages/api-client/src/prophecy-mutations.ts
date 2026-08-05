import type {
  CreateFulfillmentInput,
  CreateProphecyInput,
  Prophecy,
  ProphecyFulfillment,
  UpdateFulfillmentInput,
  UpdateProphecyInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Todo lo de profecías se invalida junto.
 *
 * Anotar un cumplimiento cambia el estado de la fila, las cuentas de la portada
 * y el gráfico mensual: invalidar la raíz es más barato que acertar cuál de las
 * tres consultas hay que refrescar en cada caso.
 */
function refresh(client: ReturnType<typeof useQueryClient>) {
  return client.invalidateQueries({ queryKey: queryKeys.prophecies.all });
}

export function useCreateProphecy(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProphecyInput) => api.post<Prophecy>('/prophecies', { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateProphecy(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateProphecyInput & { id: string }) =>
      api.patch<Prophecy>(`/prophecies/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteProphecy(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/prophecies/${id}`),
    onSuccess: () => refresh(client),
  });
}

export function useCreateFulfillment(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ prophecyId, ...input }: CreateFulfillmentInput & { prophecyId: string }) =>
      api.post<ProphecyFulfillment>(`/prophecies/${prophecyId}/fulfillments`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useUpdateFulfillment(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({
      prophecyId,
      id,
      ...input
    }: UpdateFulfillmentInput & { prophecyId: string; id: string }) =>
      api.patch<ProphecyFulfillment>(`/prophecies/${prophecyId}/fulfillments/${id}`, { ...input }),
    onSuccess: () => refresh(client),
  });
}

export function useDeleteFulfillment(api: ApiClient) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: ({ prophecyId, id }: { prophecyId: string; id: string }) =>
      api.delete<void>(`/prophecies/${prophecyId}/fulfillments/${id}`),
    onSuccess: () => refresh(client),
  });
}
