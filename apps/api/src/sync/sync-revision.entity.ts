import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Revisión de cada entidad, aparte de las tablas de dominio para no tocar sus
 * UUID ni sus columnas. La sube el mismo trigger que registra el cambio, dentro
 * de la transacción de la escritura; el bloqueo de esta fila serializa a dos
 * editores simultáneos de la misma entidad.
 */
@Entity('sync_revisions')
export class SyncRevision {
    @PrimaryColumn({ name: 'table_name', type: 'varchar', length: 64 })
    tableName: string;

    @PrimaryColumn({ name: 'entity_id', type: 'varchar', length: 64 })
    entityId: string;

    @Column({ type: 'integer' })
    revision: number;
}
