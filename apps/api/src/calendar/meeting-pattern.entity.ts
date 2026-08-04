import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import { PatternPhase } from './pattern-phase.entity';

/**
 * La reunión fija de un día de la semana en una sede: «los viernes en Elda a
 * las 20:00, con estas fases».
 *
 * Sustituye a la `RRULE` de la primera versión del RFC (D2): aquí las
 * reuniones son semanales de verdad, y un día de la semana con una hora cubre
 * el caso entero sin arrastrar excepciones, `EXDATE` ni una librería más.
 *
 * De aquí no salen filas: el mes se pinta expandiendo los patrones al vuelo y
 * solo se materializa la reunión que alguien toca (D3).
 */
@Entity('meeting_patterns')
export class MeetingPattern extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ description: 'De qué calendario es (D15)' })
  @Index()
  @Column({ name: 'calendar_id', type: UUID })
  calendarId: string;

  @ApiProperty()
  @Index()
  @Column({ name: 'congregation_id', type: UUID })
  congregationId: string;

  @ApiProperty({ example: 'Culto' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Domingo es 0, como en Date.getDay()', example: 5 })
  @Column({ type: 'int' })
  weekday: number;

  @ApiProperty({ description: 'Hora local de la iglesia', example: '20:00' })
  @Column({ name: 'start_time', type: 'time' })
  startTime: string;

  @ApiProperty({ example: 'success' })
  @Column({ type: 'text' })
  accent: string;

  @ApiProperty()
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Desde cuándo se propone. Nulo es siempre' })
  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom: string | null;

  @ApiPropertyOptional({ description: 'Hasta cuándo se propone. Nulo es siempre' })
  @Column({ name: 'valid_to', type: 'date', nullable: true })
  validTo: string | null;

  @OneToMany(() => PatternPhase, (phase) => phase.pattern, { cascade: true })
  phases: PatternPhase[];
}
