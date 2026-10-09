import { deviceSchema, type Device, type SyncCapabilities } from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Los teléfonos vinculados a la cuenta, el más reciente primero. */
export function useDevices(api: ApiClient, enabled = true): UseQueryResult<Device[]> {
    return useQuery({
        queryKey: queryKeys.devices.list,
        queryFn: async () => deviceSchema.array().parse(await api.get<unknown>('/devices')),
        enabled,
        staleTime: 30_000,
    });
}

/** A qué servidor se está a punto de vincular; público, sin credencial. */
export function useSyncCapabilities(api: ApiClient): UseQueryResult<SyncCapabilities> {
    return useQuery({
        queryKey: queryKeys.devices.capabilities,
        queryFn: () => api.get<SyncCapabilities>('/sync/capabilities'),
        staleTime: 5 * 60_000,
    });
}
