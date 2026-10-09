import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';

/**
 * Recibo de una operación ya procesada. Repetir el mismo `operation_id` desde el
 * mismo dispositivo devuelve este resultado en vez de ejecutarla otra vez; con
 * otro contenido (`request_hash` distinto) es un error, no una segunda ejecución.
 */
@Entity('sync_receipts')
@Index('UQ_sync_receipts_device_operation', ['deviceId', 'operationId'], { unique: true })
export class SyncReceipt {
    @PrimaryColumn({ type: UUID })
    id: string;

    @Column({ name: 'device_id', type: 'varchar', length: 64 })
    deviceId: string;

    @Column({ name: 'operation_id', type: 'varchar', length: 64 })
    operationId: string;

    @Column({ name: 'request_hash', type: 'varchar', length: 64 })
    requestHash: string;

    /** El resultado devuelto, serializado. */
    @Column({ type: 'text' })
    result: string;

    @Column({ name: 'created_at', type: TIMESTAMP })
    createdAt: Date;
}
