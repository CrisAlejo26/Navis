import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Believer } from './believer.entity';

/**
 * Quién tiene cuál (RFC 0003 §5.2).
 *
 * Misma forma que `believer_ministries` —tabla puente con las columnas de
 * `BaseEntity` y un índice único— y se resuelve igual: se borra y se vuelve a
 * escribir el juego entero, porque son cuatro filas y el índice ya impide
 * repetir.
 */
@Entity('believer_gifts')
@Index('UQ_believer_gifts', ['believerId', 'giftId'], { unique: true })
export class BelieverGift extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'believer_id', type: UUID })
  believerId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('Believer', 'gifts', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'believer_id' })
  believer: Relation<Believer>;

  @ApiProperty()
  @Index()
  @Column({ name: 'gift_id', type: UUID })
  giftId: string;

  /**
   * Mes y año en que lo recibió, con el día 1 (RFC 0012). Nulo es lo normal:
   * casi nadie apunta la fecha, y el don se tiene igual.
   */
  @ApiPropertyOptional({ description: 'Cuándo lo recibió; se guarda el día 1 del mes' })
  @Column({ name: 'received_at', type: 'date', nullable: true })
  receivedAt: string | null;
}
