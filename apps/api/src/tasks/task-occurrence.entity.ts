import type { TaskStatus } from '@navis/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import type { Task } from './task.entity';

/**
 * El día concreto de una tarea repetitiva, materializado (RFC 0018 §5.2, D3).
 * Solo existe una fila cuando alguien toca ese día: el resto se calcula al
 * vuelo expandiendo la plantilla.
 */
@Entity('task_occurrences')
@Index('UQ_task_occurrences', ['taskId', 'date'], { unique: true })
export class TaskOccurrence extends BaseEntity {
  @Column({ name: 'task_id', type: UUID })
  taskId: string;

  @ManyToOne('Task', 'occurrences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text' })
  status: TaskStatus;

  @Column({ name: 'completed_at', type: TIMESTAMP, nullable: true })
  completedAt: Date | null;
}
