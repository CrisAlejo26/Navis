import {
  publicListGateSchema,
  type PublicList,
  type PublicListAccessInput,
  type PublicListGate,
} from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { ApiError } from './api-error';
import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * La lista publicada, **sin sesión** (RFC 0010 §7.3).
 *
 * Es la única consulta del proyecto que hace alguien que no ha entrado, así que
 * no se reintenta ni se refresca al volver a la pestaña: quien mira un cartel en
 * la puerta no espera que se le mueva debajo.
 *
 * El 401 no es un fallo que enseñar: es **la puerta**, y trae en `data` lo poco
 * que hace falta para pintarla.
 */
export function usePublicList(api: ApiClient, token: string): UseQueryResult<PublicList> {
  return useQuery({
    queryKey: queryKeys.lists.public(token),
    queryFn: () => api.get<PublicList>(`/public/lists/${token}`),
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  });
}

/** La puerta que venía dentro del 401, o `null` si el error es otra cosa. */
export function gateOf(error: unknown): PublicListGate | null {
  if (!(error instanceof ApiError) || error.status !== 401) return null;

  const parsed = publicListGateSchema.safeParse(error.body?.data);

  return parsed.success ? parsed.data : null;
}

export function useEnterPublicList(api: ApiClient, token: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (input: PublicListAccessInput) =>
      api.post<PublicList>(`/public/lists/${token}/access`, { ...input }),
    // La respuesta **es** la lista: se siembra la caché en vez de volver a
    // pedirla, y así el telón se levanta sin un segundo viaje.
    onSuccess: (list) => {
      client.setQueryData(queryKeys.lists.public(token), list);
    },
  });
}

/** Salir borra la cookie. En un teléfono prestado, eso importa (§8.6). */
export function useExitPublicList(api: ApiClient, token: string) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: () => api.post<void>(`/public/lists/${token}/exit`),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.lists.public(token) }),
  });
}
