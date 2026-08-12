import { Column, Entity, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import { TaskReminderTag } from './task-reminder-tag.entity';
import type { Task } from './task.entity';

/** El recordatorio de una tarea: 1:1, con sus propias etiquetas (D10, D11). */
@Entity('task_reminders')
export class TaskReminder extends BaseEntity {
  @Column({ name: 'task_id', type: UUID, unique: true })
  taskId: string;

  @ManyToOne('Task', 'reminders', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task: Relation<Task>;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'remind_at', type: TIMESTAMP })
  remindAt: Date;

  @OneToMany(() => TaskReminderTag, (link) => link.reminder, { cascade: true })
  tags: TaskReminderTag[];
}
