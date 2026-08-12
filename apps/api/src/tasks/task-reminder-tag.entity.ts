import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Tag } from './tag.entity';
import type { TaskReminder } from './task-reminder.entity';

/** Las etiquetas del recordatorio, aparte de las de la tarea (D11). */
@Entity('task_reminder_tags')
@Index('UQ_task_reminder_tags', ['reminderId', 'tagId'], { unique: true })
export class TaskReminderTag extends BaseEntity {
  @Column({ name: 'reminder_id', type: UUID })
  reminderId: string;

  @Column({ name: 'tag_id', type: UUID })
  tagId: string;

  @ManyToOne('TaskReminder', 'tags', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reminder_id' })
  reminder: Relation<TaskReminder>;

  @ManyToOne('Tag', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Relation<Tag>;
}
