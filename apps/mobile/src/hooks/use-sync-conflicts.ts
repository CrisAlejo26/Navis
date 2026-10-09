import type { LocalRow } from '@navis/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getDb } from '@/data/db';
import { destinationOf } from '@/lib/sync/capture';
import { listOpenConflicts, type ConflictKind } from '@/lib/sync/conflicts-store';
import { describeEntity } from '@/lib/sync/describe-entity';
import { syncRunner } from '@/lib/sync/device-runner';
import { resolveConflict, type Decision, type ResolveOutcome } from '@/lib/sync/resolve-conflict';
import { useSyncConnection } from '@/stores/sync-connection';

const KEY = ['sync', 'conflicts'] as const;

export interface ConflictView {
    id: number;
    table: string;
    entityId: string;
    kind: ConflictKind;
    fields: string[];
    title: string;
    local: LocalRow | null;
    remote: LocalRow | null;
}

const parse = (json: string | null): LocalRow | null =>
    json === null ? null : (JSON.parse(json) as LocalRow);

/** Los conflictos abiertos del destino al que está vinculado el teléfono. */
export function useOpenConflicts() {
    const link = useSyncConnection((state) => state.link);
    return useQuery({
        queryKey: [...KEY, link ? destinationOf(link) : null],
        enabled: link !== null,
        queryFn: async (): Promise<ConflictView[]> => {
            if (!link) return [];
            const rows = await listOpenConflicts(await getDb(), destinationOf(link));
            return rows.map((row) => {
                const local = parse(row.local_json);
                const remote = parse(row.remote_json);
                return {
                    id: row.id,
                    table: row.table_name,
                    entityId: row.entity_id,
                    kind: row.kind,
                    fields: row.fields_json ? (JSON.parse(row.fields_json) as string[]) : [],
                    title: describeEntity(row.table_name, local ?? remote),
                    local,
                    remote,
                };
            });
        },
    });
}

/**
 * Aplica la decisión y, si se pudo, sincroniza enseguida: lo resuelto sube con la
 * revisión del servidor como base, y si otro editó mientras tanto vuelve a
 * compararse. Lo que se pinta (listas, fichas) se recarga porque los datos
 * locales pueden haber cambiado.
 */
export function useResolveConflict() {
    const client = useQueryClient();
    const link = useSyncConnection((state) => state.link);
    return useMutation({
        mutationFn: async (input: { id: number; decision: Decision }): Promise<ResolveOutcome> => {
            if (!link) return 'missing';
            const outcome = await resolveConflict(
                await getDb(),
                destinationOf(link),
                input.id,
                input.decision,
                new Date().toISOString(),
            );
            if (outcome === 'resolved')
                void syncRunner.syncNow({ manual: true }).catch(() => undefined);
            return outcome;
        },
        onSuccess: () => client.invalidateQueries(),
    });
}
