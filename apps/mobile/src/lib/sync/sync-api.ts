import { createApiClient, type ApiClient } from '@navis/api-client';
import {
    syncCapabilitiesSchema,
    syncChangesPageSchema,
    syncOperationResultSchema,
    type SyncCapabilities,
    type SyncChangesPage,
    type SyncOperation,
    type SyncOperationResult,
} from '@navis/shared';
import { z } from 'zod';

import { NO_REDIRECT } from './link-device';

/** Lo que el motor necesita del servidor; en los tests se sustituye por un doble. */
export interface SyncApi {
    capabilities(): Promise<SyncCapabilities>;
    changes(query: {
        cursor: number;
        limit: number;
        generation?: string;
    }): Promise<SyncChangesPage>;
    operations(operations: SyncOperation[]): Promise<SyncOperationResult[]>;
}

const operationsResponse = z.object({ results: z.array(syncOperationResultSchema) });

/** El cliente HTTP real. Toda respuesta se valida con el esquema compartido: nada entra sin comprobar. */
export function createSyncApi(client: ApiClient): SyncApi {
    return {
        capabilities: async () =>
            syncCapabilitiesSchema.parse(
                await client.get<unknown>('/sync/capabilities', NO_REDIRECT),
            ),
        changes: async ({ cursor, limit, generation }) => {
            const params = new URLSearchParams({ cursor: String(cursor), limit: String(limit) });
            if (generation) params.set('generation', generation);
            return syncChangesPageSchema.parse(
                await client.get<unknown>(`/sync/changes?${params.toString()}`, NO_REDIRECT),
            );
        },
        operations: async (operations) =>
            operationsResponse.parse(
                await client.post<unknown>('/sync/operations', { operations }, NO_REDIRECT),
            ).results,
    };
}

export { createApiClient };
