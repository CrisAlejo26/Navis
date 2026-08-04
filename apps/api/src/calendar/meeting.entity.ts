import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { MeetingStatus } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import { MeetingSlot } from './meeting-slot.entity';

/**
 * Una reunión concreta de un día, ya materializada.
 *
 * `date` y `start_time` son **fecha y hora locales**, no un `timestamptz`
 * (D5): la reunión del viernes es del viernes aunque el servidor esté en otro
 * huso, y guardarla como instante regala el clásico «la de las 00:30 aparece
 * el jueves». La zona de la iglesia solo entra al comparar con «ahora».
 *
 * `pattern_id` nulo significa reunión puntual. El índice único de la migración
 * es parcial —`pattern_id` no nulo y sin borrar— para que dos clics
 * simultáneos no materialicen dos veces el mismo día y, a la vez, dos
 * reuniones puntuales del mismo día no choquen entre sí.
 */
@Entity('meetings')
@Index('IDX_meetings_calendar_date', ['calendarId', 'date'])
@Index('IDX_meetings_church_date', ['churchId', 'date'])
@Index('IDX_meetings_congregation_date', ['congregationId', 'date'])
export class Meeting extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ description: 'De qué calendario es (D15)' })
  @Column({ name: 'calendar_id', type: UUID })
  calendarId: string;

  @ApiProperty()
  @Column({ name: 'congregation_id', type: UUID })
  congregationId: string;

  @ApiPropertyOptional({ description: 'De qué patrón nació. Nulo si es puntual' })
  @Column({ name: 'pattern_id', type: UUID, nullable: true })
  patternId: string | null;

  @ApiProperty({ description: 'Día local', example: '2026-08-15' })
  @Column({ type: 'date' })
  date: string;

  @ApiProperty({ example: '20:00' })
  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @ApiProperty({ example: 'Culto' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  accent: string;

  @ApiProperty({ enum: ['programada', 'cancelada'] })
  @Column({ type: 'text', default: 'programada' })
  status: MeetingStatus;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => MeetingSlot, (slot) => slot.meeting, { cascade: true })
  slots: MeetingSlot[];
}
