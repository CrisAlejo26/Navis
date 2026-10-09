import { deviceLinkSchema, type DeviceLink } from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/** Genera el token de vinculación. No se cachea: se enseña una vez y caduca. */
export function useCreateDeviceLink(api: ApiClient) {
    return useMutation({
        mutationFn: async (): Promise<DeviceLink> =>
            // El JSON trae las fechas como texto: el esquema las convierte en Date.
            deviceLinkSchema.parse(await api.post<unknown>('/device-links')),
    });
}

export function useRevokeDevice(api: ApiClient) {
    const client = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.delete<void>(`/devices/${id}`),
        onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.devices.list }),
    });
}
