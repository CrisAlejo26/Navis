import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Prophecy } from './prophecy.entity';

/**
 * Una parte de la profecía que ya se cumplió (RFC 0004 D4).
 *
 * Es una tabla y no un campo de texto en la profecía porque hace falta contar
 * («cuántas van en camino»), ordenar («lo último que se movió») y pintar las
 * marcas de la travesía. Nada de eso lo da un `fulfillmentNotes` de texto libre.
 *
 * `owner_id` está duplicado a propósito: así la regla de D1 —el filtro por
 * dueño— se cumple también aquí **sin depender de que alguien se acuerde de
 * unir con la tabla padre**. Es la misma decisión que `church_id` en
 * `believer_notes`.
 */
@Entity('prophecy_fulfillments')
@Index('IDX_prophecy_fulfillments_prophecy', ['prophecyId', 'occurredAt'])
export class ProphecyFulfillment extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'prophecy_id', type: UUID })
  prophecyId: string;

  @ApiProperty({ description: 'Denormalizado para no depender de un JOIN (D1)' })
  @Index()
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('Prophecy', 'fulfillments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'prophecy_id' })
  prophecy: Relation<Prophecy>;

  @ApiProperty({ description: 'Qué parte se ha cumplido' })
  @Column({ type: 'text' })
  text: string;

  @ApiProperty({ description: 'Cuándo se cumplió esa parte', example: '2026-07-14' })
  @Column({ name: 'occurred_at', type: 'date' })
  occurredAt: string;
}
