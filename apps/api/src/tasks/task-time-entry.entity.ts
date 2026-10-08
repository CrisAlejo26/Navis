import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';

/**
 * Una entrada del cronómetro de una tarea (Fase 7c): nace al pulsar «empezar»
 * y se cierra al «parar». La duración se calcula, no se guarda. Sin relación
 * de TypeORM con la tarea: una tarea borrada conserva su tiempo (D18).
 *
 * Una persona tiene como mucho **una** entrada abierta (`ended_at` nulo): lo
 * garantiza el servicio, que cierra la anterior antes de abrir otra.
 */
@Entity('task_time_entries')
@Index('IDX_task_time_church_owner_started', ['churchId', 'ownerId', 'startedAt'])
export class TaskTimeEntry extends BaseEntity {
    @ApiProperty()
    @Index()
    @Column({ name: 'church_id', type: UUID })
    churchId: string;

    @ApiProperty({ description: 'De quién es' })
    @Column({ name: 'owner_id', type: 'text' })
    ownerId: string;

    @ApiProperty()
    @Index()
    @Column({ name: 'task_id', type: UUID })
    taskId: string;

    @ApiProperty()
    @Column({ name: 'started_at', type: TIMESTAMP })
    startedAt: Date;

    @ApiPropertyOptional({ description: 'Nulo mientras el cronómetro corre' })
    @Column({ name: 'ended_at', type: TIMESTAMP, nullable: true })
    endedAt: Date | null;
}
