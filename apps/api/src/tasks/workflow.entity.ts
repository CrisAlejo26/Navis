import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Un flujo de trabajo (Fase 7b): un grupo con nombre y color al que se asigna
 * una tarea. Mismo patrón que `Tag`, por cuenta y por iglesia. La tarea lo
 * referencia con `tasks.workflow_id` **sin** relación de TypeORM: borrar el
 * flujo deja a sus tareas sin flujo, y eso lo hace el servicio.
 */
@Entity('workflows')
@Index('UQ_workflows_church_owner_name', ['churchId', 'ownerId', 'name'], { unique: true })
export class Workflow extends BaseEntity {
    @ApiProperty()
    @Index()
    @Column({ name: 'church_id', type: UUID })
    churchId: string;

    @ApiProperty({ description: 'De quién es' })
    @Column({ name: 'owner_id', type: 'text' })
    ownerId: string;

    @ApiProperty()
    @Column({ type: 'text' })
    name: string;

    @ApiPropertyOptional()
    @Column({ type: 'text', nullable: true })
    description: string | null;

    @ApiProperty({ description: 'Token o hexadecimal de accentSchema' })
    @Column({ type: 'text' })
    accent: string;

    @ApiProperty()
    @Column({ type: 'int', default: 0 })
    position: number;
}
