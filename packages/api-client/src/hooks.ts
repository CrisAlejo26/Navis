import type { Profile, UpdateProfileInput, Weather } from '@navis/shared';
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Hooks compartidos por web y móvil. Reciben el cliente por parámetro en vez
 * de leerlo de un contexto, para que cada app decida cómo construirlo.
 */
export function useProfile(api: ApiClient, enabled = true): UseQueryResult<Profile> {
  return useQuery({
    queryKey: queryKeys.profile.me(),
    queryFn: () => api.get<Profile>('/me/profile'),
    enabled,
    staleTime: 60_000,
  });
}

export function useUpdateProfile(api: ApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => api.patch<Profile>('/me/profile', input),
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.profile.me(), profile);
    },
  });
}

/**
 * El tiempo de la ciudad del perfil, o `null` si todavía no hay ninguna puesta.
 *
 * Media hora de vigencia: el servidor ya cachea la lectura un cuarto de hora, y
 * nadie abre el panel para ver cómo cambia el termómetro.
 */
export function useWeather(api: ApiClient, enabled = true): UseQueryResult<Weather | null> {
  return useQuery({
    queryKey: queryKeys.weather,
    queryFn: () => api.get<Weather | null>('/weather'),
    enabled,
    retry: false,
    staleTime: 30 * 60_000,
  });
}

export interface AiStatus {
  enabled: boolean;
  provider: string;
  model: string;
}

export function useAiStatus(api: ApiClient): UseQueryResult<AiStatus> {
  return useQuery({
    queryKey: queryKeys.ai.status,
    queryFn: () => api.get<AiStatus>('/ai/status'),
    staleTime: 5 * 60_000,
  });
}
