import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Meeting } from './meeting.entity';

/**
 * Una **fase** de una reunión y quién la ocupa. Es la unidad real de este
 * calendario (D1): lo que se toca, lo que se comparte y lo que puede estar
 * vacío.
 *
 * `believer_id` nulo es una fase sin asignar, y se ve: en la interfaz sale
 * como una línea de puntos que pide que la rellenen, que es justo la
 * información que hoy se pierde en la hoja de cálculo.
 */
@Entity('meeting_slots')
@Index('IDX_meeting_slots_order', ['meetingId', 'position'])
export class MeetingSlot extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'meeting_id', type: UUID })
  meetingId: string;

  /* Por nombre y con `Relation<>`, para no cerrar el ciclo padre-hijo al
     cargar los módulos (ver `pattern-phase.entity.ts`). */
  @ManyToOne('Meeting', 'slots', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meeting_id' })
  meeting: Relation<Meeting>;

  @ApiProperty({ example: 'Introducción' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Orden dentro de la reunión, empezando en 0' })
  @Column({ type: 'int' })
  position: number;

  @ApiPropertyOptional({ description: 'Quién la ocupa. Nulo es sin asignar' })
  @Index()
  @Column({ name: 'believer_id', type: UUID, nullable: true })
  believerId: string | null;

  @ApiPropertyOptional({ example: 'Tema: Hechos 2' })
  @Column({ type: 'text', nullable: true })
  note: string | null;
}
