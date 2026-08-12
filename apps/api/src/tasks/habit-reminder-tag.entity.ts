import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { HabitReminder } from './habit-reminder.entity';
import type { Tag } from './tag.entity';

/** Las etiquetas del recordatorio de un hábito, aparte de las del hábito. */
@Entity('habit_reminder_tags')
@Index('UQ_habit_reminder_tags', ['reminderId', 'tagId'], { unique: true })
export class HabitReminderTag extends BaseEntity {
  @Column({ name: 'reminder_id', type: UUID })
  reminderId: string;

  @Column({ name: 'tag_id', type: UUID })
  tagId: string;

  @ManyToOne('HabitReminder', 'tags', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reminder_id' })
  reminder: Relation<HabitReminder>;

  @ManyToOne('Tag', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tag_id' })
  tag: Relation<Tag>;
}
