import { Column, Entity, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import { HabitReminderTag } from './habit-reminder-tag.entity';
import type { Habit } from './habit.entity';

/** El recordatorio de un hábito: mismo patrón que el de la tarea. */
@Entity('habit_reminders')
export class HabitReminder extends BaseEntity {
  @Column({ name: 'habit_id', type: UUID, unique: true })
  habitId: string;

  @ManyToOne('Habit', 'reminders', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit: Relation<Habit>;

  @Column({ type: 'boolean', default: true })
  enabled: boolean;

  @Column({ name: 'remind_at', type: TIMESTAMP })
  remindAt: Date;

  @OneToMany(() => HabitReminderTag, (link) => link.reminder, { cascade: true })
  tags: HabitReminderTag[];
}
