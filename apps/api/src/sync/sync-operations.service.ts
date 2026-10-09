import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { SyncOperation, SyncOperationResult } from '@navis/shared';
import { createHash, randomUUID } from 'node:crypto';
import { DataSource, type EntityManager } from 'typeorm';

import type { AuthUser } from '../auth/auth';
import { isUniqueViolation } from '../database/unique-violation';
import { deletesProtectedEntity, PROTECTED_REASON } from './sync-operation-rules';
import { SyncAdapterRegistry, type AdapterOutcome } from './sync-adapter-registry';
import { SyncReceipt } from './sync-receipt.entity';
import { SyncRevision } from './sync-revision.entity';

const hashOperation = (operation: SyncOperation): string =>
    createHash('sha256').update(JSON.stringify(operation)).digest('hex');

/** `reason` cuando el resultado guardado ya no se puede interpretar (no debería pasar). */
const CORRUPT = 'receipt-unreadable';

/**
 * Aplica las operaciones del cliente de forma idempotente. El adaptador de la
 * tabla y el recibo se confirman en **la misma transacción**: o queda aplicada y
 * con recibo, o no queda ninguna de las dos. Repetir un `operationId` devuelve
 * el resultado de la primera vez; con otro contenido es un error y no se ejecuta.
 */
@Injectable()
export class SyncOperationsService {
    constructor(
        @InjectDataSource() private readonly dataSource: DataSource,
        private readonly adapters: SyncAdapterRegistry,
    ) {}

    async apply(
        deviceKey: string,
        user: AuthUser,
        operations: readonly SyncOperation[],
    ): Promise<SyncOperationResult[]> {
        const results: SyncOperationResult[] = [];
        // En orden y una a una: la segunda edición de una entidad depende de la revisión de la primera.
        for (const operation of operations) {
            results.push(await this.applyOne(deviceKey, user, operation));
        }
        return results;
    }

    private async applyOne(
        deviceKey: string,
        user: AuthUser,
        operation: SyncOperation,
    ): Promise<SyncOperationResult> {
        const requestHash = hashOperation(operation);
        const previous = await this.findReceipt(this.dataSource.manager, deviceKey, operation);
        if (previous) return this.replay(previous, requestHash, operation);

        // Borrar una iglesia, una membresía o un rol tiene su propio flujo: aquí nunca.
        if (deletesProtectedEntity(operation)) {
            return {
                operationId: operation.operationId,
                status: 'rejected',
                reason: PROTECTED_REASON,
            };
        }

        const adapter = this.adapters.get(operation.table);
        if (!adapter) {
            return {
                operationId: operation.operationId,
                status: 'rejected',
                reason: 'unsupported-table',
            };
        }

        try {
            return await this.dataSource.transaction(async (manager) => {
                // La revisión base manda: si la entidad avanzó desde que el cliente la leyó,
                // no se aplica a ciegas (la fusión es la Fase 6) y se devuelve la actual.
                const current = await manager.getRepository(SyncRevision).findOneBy({
                    tableName: operation.table,
                    entityId: operation.id,
                });
                const revision = current?.revision ?? 0;
                const outcome: AdapterOutcome =
                    operation.baseRevision === revision
                        ? await adapter.apply(operation, user, manager)
                        : {
                              status: 'conflict',
                              reason: 'stale-base',
                              ...(revision > 0 ? { revision } : {}),
                          };
                const result: SyncOperationResult = {
                    operationId: operation.operationId,
                    ...outcome,
                };
                // Un rechazo por validación no deja recibo: el cliente puede corregirlo y reintentar.
                if (outcome.status !== 'rejected') {
                    await manager.getRepository(SyncReceipt).insert({
                        id: randomUUID(),
                        deviceId: deviceKey,
                        operationId: operation.operationId,
                        requestHash,
                        result: JSON.stringify(result),
                        createdAt: new Date(),
                    });
                }
                return result;
            });
        } catch (error) {
            if (!isUniqueViolation(error)) throw error;
            // Dos envíos simultáneos de la misma operación: gana el primero, el otro lee su recibo.
            const winner = await this.findReceipt(this.dataSource.manager, deviceKey, operation);
            if (!winner) throw error;
            return this.replay(winner, requestHash, operation);
        }
    }

    private findReceipt(manager: EntityManager, deviceKey: string, operation: SyncOperation) {
        return manager
            .getRepository(SyncReceipt)
            .findOneBy({ deviceId: deviceKey, operationId: operation.operationId });
    }

    private replay(
        receipt: SyncReceipt,
        requestHash: string,
        operation: SyncOperation,
    ): SyncOperationResult {
        if (receipt.requestHash !== requestHash) {
            return {
                operationId: operation.operationId,
                status: 'rejected',
                reason: 'operation-id-reuse',
            };
        }
        const stored: unknown = JSON.parse(receipt.result);
        const revision =
            typeof stored === 'object' && stored !== null && 'revision' in stored
                ? Number(stored.revision)
                : undefined;
        if (revision !== undefined && !Number.isInteger(revision)) {
            return { operationId: operation.operationId, status: 'rejected', reason: CORRUPT };
        }
        return { operationId: operation.operationId, status: 'duplicate', revision };
    }
}
