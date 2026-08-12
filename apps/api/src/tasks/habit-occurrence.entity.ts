import type { HabitStatus } from '@navis/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import type { Habit } from './habit.entity';

/** El día concreto de un hábito repetitivo, materializado (D3, D5). */
@Entity('habit_occurrences')
@Index('UQ_habit_occurrences', ['habitId', 'date'], { unique: true })
export class HabitOccurrence extends BaseEntity {
  @Column({ name: 'habit_id', type: UUID })
  habitId: string;

  @ManyToOne('Habit', 'occurrences', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'habit_id' })
  habit: Relation<Habit>;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'text' })
  status: HabitStatus;

  @Column({ name: 'completed_at', type: TIMESTAMP, nullable: true })
  completedAt: Date | null;
}
