import { ApiError } from '@navis/api-client';
import type {
    SyncCapabilities,
    SyncChange,
    SyncChangesPage,
    SyncOperation,
    SyncOperationResult,
} from '@navis/shared';

import type { SyncApi } from './sync-api';

/**
 * Un servidor de sincronización en memoria, con las mismas reglas que el real:
 * revisión por entidad, cursor con posiciones, recibos idempotentes por
 * `operationId`, conflicto cuando la revisión base no coincide y rechazo de las
 * tablas sin adaptador. Para probar el motor sin red ni base de datos.
 */
export class FakeSyncServer implements SyncApi {
    enabled = true;
    online = true;
    authorized = true;
    generation = 'g1';
    /** Tablas que el servidor sabe aplicar; el resto se rechaza con `unsupported-table`. */
    supported = new Set<string>(['believers', 'believer_notes', 'custom_table_rows']);
    /** Simula que la respuesta se pierde después de que el servidor ya aplicó el lote. */
    loseNextResponse = false;

    readonly revisions = new Map<string, number>();
    readonly rows = new Map<string, Record<string, unknown> | null>();
    readonly feed: SyncChange[] = [];
    readonly receipts = new Map<string, SyncOperationResult>();
    /** Cuántas operaciones se ejecutaron de verdad (no cuenta los duplicados). */
    executed = 0;
    calls: string[] = [];

    private key = (table: string, id: string): string => `${table}:${id}`;

    private guard(): void {
        if (!this.online) throw ApiError.network();
        if (!this.authorized) throw new ApiError('No autorizado', 401);
    }

    revisionOf(table: string, id: string): number {
        return this.revisions.get(this.key(table, id)) ?? 0;
    }

    /** Un cambio hecho por otro cliente (la web, otro teléfono). */
    remote(table: string, id: string, row: Record<string, unknown> | null): void {
        const revision = this.revisionOf(table, id) + 1;
        this.revisions.set(this.key(table, id), revision);
        this.rows.set(this.key(table, id), row);
        this.feed.push({
            position: this.feed.length + 1,
            table,
            id,
            op: row ? 'upsert' : 'delete',
            revision,
            row,
        });
    }

    capabilities(): Promise<SyncCapabilities> {
        this.calls.push('capabilities');
        this.guard();
        return Promise.resolve({
            installationName: 'Navis',
            protocolVersion: 1,
            dataSyncEnabled: this.enabled,
            linkTtlMinutes: 10,
        });
    }

    changes(query: {
        cursor: number;
        limit: number;
        generation?: string;
    }): Promise<SyncChangesPage> {
        this.calls.push('changes');
        this.guard();
        if (query.generation && query.generation !== this.generation) {
            throw new ApiError('La instalación cambió', 409);
        }
        if (query.cursor > this.feed.length) throw new ApiError('Cursor del futuro', 409);
        const page = this.feed
            .filter((change) => change.position > query.cursor)
            .slice(0, query.limit + 1);
        const hasMore = page.length > query.limit;
        const changes = hasMore ? page.slice(0, query.limit) : page;
        return Promise.resolve({
            generation: this.generation,
            changes,
            nextCursor: hasMore
                ? (changes[changes.length - 1]?.position ?? query.cursor)
                : this.feed.length,
            hasMore,
        });
    }

    operations(operations: SyncOperation[]): Promise<SyncOperationResult[]> {
        this.calls.push('operations');
        this.guard();
        const results = operations.map((operation) => this.apply(operation));
        if (this.loseNextResponse) {
            this.loseNextResponse = false;
            throw ApiError.network();
        }
        return Promise.resolve(results);
    }

    private apply(operation: SyncOperation): SyncOperationResult {
        const previous = this.receipts.get(operation.operationId);
        if (previous) return { ...previous, status: 'duplicate' };
        if (!this.supported.has(operation.table)) {
            return {
                operationId: operation.operationId,
                status: 'rejected',
                reason: 'unsupported-table',
            };
        }
        const current = this.revisionOf(operation.table, operation.id);
        if (operation.baseRevision !== current) {
            const conflict: SyncOperationResult = {
                operationId: operation.operationId,
                status: 'conflict',
                reason: 'stale-base',
                ...(current > 0 ? { revision: current } : {}),
            };
            this.receipts.set(operation.operationId, conflict);
            return conflict;
        }
        this.executed += 1;
        const row = operation.op === 'delete' ? null : (operation.fields ?? null);
        this.remote(operation.table, operation.id, row);
        const applied: SyncOperationResult = {
            operationId: operation.operationId,
            status: 'applied',
            revision: this.revisionOf(operation.table, operation.id),
        };
        this.receipts.set(operation.operationId, applied);
        return applied;
    }
}
