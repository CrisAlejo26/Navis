import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Dream } from './dream.entity';

/**
 * Qué emociones lleva un sueño (RFC 0005 §5.3).
 *
 * Misma forma que `believer_gifts`: tabla puente con las columnas de
 * `BaseEntity` y un índice único. Se resuelve igual, borrando y volviendo a
 * escribir el juego entero, porque son cuatro filas y el índice ya impide
 * repetir.
 */
@Entity('dream_emotions')
@Index('UQ_dream_emotions', ['dreamId', 'emotionId'], { unique: true })
export class DreamEmotion extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'dream_id', type: UUID })
  dreamId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('Dream', 'emotions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'dream_id' })
  dream: Relation<Dream>;

  @ApiProperty()
  @Index()
  @Column({ name: 'emotion_id', type: UUID })
  emotionId: string;
}
