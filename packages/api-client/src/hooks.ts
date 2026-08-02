import type { Profile, UpdateProfileInput } from '@pastortools/shared';
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
