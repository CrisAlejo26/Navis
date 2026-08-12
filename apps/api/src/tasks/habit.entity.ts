import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { HabitRepeatFreq, HabitStatus } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import { HabitOccurrence } from './habit-occurrence.entity';
import { HabitReminder } from './habit-reminder.entity';
import { HabitTag } from './habit-tag.entity';

/**
 * Un hábito (RFC 0018 §5.3). Misma forma que la tarea, con las diferencias
 * de D1 y D5: meta en vez de prioridad, dos estados en vez de tres, y
 * repetición simple —sin intervalo ni condición de fin—.
 */
@Entity('habits')
@Index('IDX_habits_church_owner_date', ['churchId', 'ownerId', 'date'])
export class Habit extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ description: 'De quién es (D6)' })
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  title: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  goal: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ example: '2026-08-15' })
  @Column({ type: 'date' })
  date: string;

  @ApiPropertyOptional({ description: 'Nulo: todo el día' })
  @Column({ type: 'time', nullable: true })
  time: string | null;

  @ApiPropertyOptional({ description: 'Solo si NO es repetitivo' })
  @Column({ type: 'text', nullable: true })
  status: HabitStatus | null;

  @ApiPropertyOptional({ description: 'Solo si NO es repetitivo' })
  @Column({ name: 'completed_at', type: TIMESTAMP, nullable: true })
  completedAt: Date | null;

  @ApiProperty({ enum: ['ninguna', 'diaria', 'semanal', 'mensual'] })
  @Column({ name: 'repeat_freq', type: 'text', default: 'ninguna' })
  repeatFreq: HabitRepeatFreq;

  @OneToMany(() => HabitTag, (link) => link.habit, { cascade: true })
  tags: HabitTag[];

  @OneToMany(() => HabitOccurrence, (occurrence) => occurrence.habit)
  occurrences: HabitOccurrence[];

  @OneToMany(() => HabitReminder, (reminder) => reminder.habit, { cascade: true })
  reminders: HabitReminder[];
}
