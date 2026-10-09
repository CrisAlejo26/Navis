import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';

/**
 * El registro de cambios. Lo escriben **triggers de base de datos** (ver
 * `trigger-sql.ts`), no el código de la API: así entran también las
 * modificaciones por `repo.update()`, SQL a mano o procesos automáticos, que no
 * disparan eventos de TypeORM.
 *
 * `position` nace nulo y lo asigna `SyncPublisher` solo cuando la transacción
 * que escribió el cambio ya está confirmada. Es lo que impide que un cursor se
 * salte una transacción lenta: una posición nunca se reparte antes del commit.
 */
@Entity('sync_changes')
export class SyncChange {
    @PrimaryColumn({ type: UUID })
    id: string;

    @Index('UQ_sync_changes_position', { unique: true })
    @Column({ type: 'integer', nullable: true })
    position: number | null;

    @Column({ name: 'table_name', type: 'varchar', length: 64 })
    tableName: string;

    @Column({ name: 'entity_id', type: 'varchar', length: 128 })
    entityId: string;

    @Column({ type: 'varchar', length: 10 })
    op: 'upsert' | 'delete';

    @Column({ type: 'integer' })
    revision: number;

    /** Iglesia a la que pertenece la fila (resuelta por el trigger); nula si no es de ninguna. */
    @Index('IDX_sync_changes_church_id')
    @Column({ name: 'church_id', type: UUID, nullable: true })
    churchId: string | null;

    /** Dueño cuando el dato es privado de una persona; nulo si lo ve toda la iglesia. */
    @Column({ name: 'owner_id', type: 'text', nullable: true })
    ownerId: string | null;

    @Index('IDX_sync_changes_created_at')
    @Column({ name: 'created_at', type: TIMESTAMP })
    createdAt: Date;
}
