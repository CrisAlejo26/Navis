import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { TaskPriority, TaskRepeatEndType, TaskRepeatFreq, TaskStatus } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import { TaskOccurrence } from './task-occurrence.entity';
import { TaskReminder } from './task-reminder.entity';
import { TaskTag } from './task-tag.entity';

/**
 * Una tarea (RFC 0018 §5.2). Es su propia entidad y no un `kind` compartido
 * con el hábito (D1): tres estados, prioridad, e intervalo y condición de fin
 * en su repetición — nada de eso tiene sentido en un hábito.
 *
 * `status`/`completedAt` solo valen si **no** es repetitiva (D4): una tarea
 * repetitiva los deja vacíos y su estado de cada día vive en
 * `task_occurrences` (D3).
 *
 * `date`+`time` y no un instante (D16): «la tarea del viernes» es del
 * viernes en cualquier huso.
 */
@Entity('tasks')
@Index('IDX_tasks_church_owner_date', ['churchId', 'ownerId', 'date'])
export class Task extends BaseEntity {
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
  description: string | null;

  @ApiProperty({ description: 'El día, o el primero si es repetitiva', example: '2026-08-15' })
  @Column({ type: 'date' })
  date: string;

  @ApiPropertyOptional({ description: 'Nulo: todo el día' })
  @Column({ type: 'time', nullable: true })
  time: string | null;

  @ApiProperty({ enum: ['baja', 'media', 'alta'] })
  @Column({ type: 'text', default: 'media' })
  priority: TaskPriority;

  @ApiPropertyOptional({ description: 'Solo si NO es repetitiva (D4)' })
  @Column({ type: 'text', nullable: true })
  status: TaskStatus | null;

  @ApiPropertyOptional({ description: 'Solo si NO es repetitiva' })
  @Column({ name: 'completed_at', type: TIMESTAMP, nullable: true })
  completedAt: Date | null;

  @ApiProperty()
  @Column({ name: 'is_recurring', type: 'boolean', default: false })
  isRecurring: boolean;

  @ApiPropertyOptional({ enum: ['diaria', 'semanal', 'mensual'] })
  @Column({ name: 'repeat_freq', type: 'text', nullable: true })
  repeatFreq: TaskRepeatFreq | null;

  @ApiProperty({ description: 'Cada N días/semanas/meses: 2 es «cada 2 días»' })
  @Column({ name: 'repeat_interval', type: 'int', default: 1 })
  repeatInterval: number;

  @ApiPropertyOptional({ enum: ['nunca', 'fecha', 'cantidad'] })
  @Column({ name: 'repeat_end_type', type: 'text', nullable: true })
  repeatEndType: TaskRepeatEndType | null;

  @ApiPropertyOptional()
  @Column({ name: 'repeat_end_date', type: 'date', nullable: true })
  repeatEndDate: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'repeat_end_count', type: 'int', nullable: true })
  repeatEndCount: number | null;

  @OneToMany(() => TaskTag, (link) => link.task, { cascade: true })
  tags: TaskTag[];

  @OneToMany(() => TaskOccurrence, (occurrence) => occurrence.task)
  occurrences: TaskOccurrence[];

  @OneToMany(() => TaskReminder, (reminder) => reminder.task, { cascade: true })
  reminders: TaskReminder[];
}
