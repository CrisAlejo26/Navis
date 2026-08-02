import { QueryClient } from '@tanstack/react-query';

import { ApiError } from './api-error';

/**
 * Configuración compartida de TanStack Query. Lo importante: no reintentar
 * errores 4xx (no se arreglan solos) y sí los de red.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
