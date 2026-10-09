import { Injectable } from '@nestjs/common';
import type { SyncOperation, SyncOperationResult } from '@navis/shared';
import type { EntityManager } from 'typeorm';

import type { AuthUser } from '../auth/auth';

/** Lo que un adaptador devuelve: el resultado sin el `operationId`, que pone el servicio. */
export type AdapterOutcome = Omit<SyncOperationResult, 'operationId'>;

/**
 * Cómo se aplica una operación sobre **una** tabla, con las reglas de dominio y
 * los permisos de los servicios normales (Fase 8: uno por módulo). No hay una
 * vía genérica que escriba en cualquier tabla: lo que no tiene adaptador se
 * rechaza. Se ejecuta dentro de la transacción que luego guarda el recibo.
 */
export interface SyncAdapter {
    readonly table: string;
    apply(
        operation: SyncOperation,
        user: AuthUser,
        manager: EntityManager,
    ): Promise<AdapterOutcome>;
}

@Injectable()
export class SyncAdapterRegistry {
    private readonly adapters = new Map<string, SyncAdapter>();

    register(adapter: SyncAdapter): void {
        if (this.adapters.has(adapter.table)) {
            throw new Error(`Ya hay un adaptador de sincronización para ${adapter.table}`);
        }
        this.adapters.set(adapter.table, adapter);
    }

    get(table: string): SyncAdapter | undefined {
        return this.adapters.get(table);
    }
}
