import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Tag } from './tag.entity';
import type { Task } from './task.entity';

/** Qué etiquetas lleva una tarea (RFC 0018 §5.2). Tabla puente, única por par. */
@Entity('task_tags')
@Index('UQ_task_tags', ['taskId', 'tagId'], { unique: true })
export class TaskTag extends BaseEntity {
  @Column({ name: 'task_id', type: UUID })
  taskId: string;

  @Column({ name: 'tag_id', type: UUID })
  tagId: string;

  // Referenciado por nombre y con `Relation<>`: con la clase importada de
  // verdad, `emitDecoratorMetadata` la evalúa al cargar el módulo y el par
  // padre-hijo se queda en un ciclo (CLAUDE.md).
  @ManyToOne('Task', 'tags', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  @ManyToOne('Tag', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Relation<Tag>;
}
