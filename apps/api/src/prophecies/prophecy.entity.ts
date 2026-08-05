import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { ProphecyFulfillment } from './prophecy-fulfillment.entity';

/**
 * Una palabra profética recibida (RFC 0004 §5.1).
 *
 * **No lleva `church_id`, y es a propósito** (D1). Es de un usuario, no de una
 * iglesia: si mañana entra en otra, o en ninguna, sus profecías siguen siendo
 * las suyas y las mismas. Es el único módulo del proyecto así — si alguien ve
 * que «falta» la columna, no falta.
 *
 * Tampoco hay columna de estado: se deriva de `fulfilled_at` y de si hay algún
 * cumplimiento parcial (D3). Guardarla además sería tener dos fuentes de verdad.
 */
@Entity('prophecies')
@Index('IDX_prophecies_owner_received', ['ownerId', 'receivedAt'])
@Index('IDX_prophecies_owner_fulfilled', ['ownerId', 'fulfilledAt'])
@Index('IDX_prophecies_owner_search', ['ownerId', 'searchText'])
export class Prophecy extends BaseEntity {
  @ApiProperty({ description: 'De quién es. La única barrera de acceso que hay (D1)' })
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  title: string;

  @ApiProperty({ description: 'La palabra, entera. Texto plano: no lleva Markdown' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Título y cuerpo en minúsculas y sin acentos (D13)' })
  @Column({ name: 'search_text', type: 'text' })
  searchText: string;

  @ApiProperty({ description: 'Cuándo se recibió', example: '2026-03-14' })
  @Column({ name: 'received_at', type: 'date' })
  receivedAt: string;

  @ApiPropertyOptional({ description: 'Cuándo se acabó de cumplir. Nulo mientras siga abierta' })
  @Column({ name: 'fulfilled_at', type: 'date', nullable: true })
  fulfilledAt: string | null;

  @ApiPropertyOptional({ description: 'El último cumplimiento parcial. Derivado (D4)' })
  @Column({ name: 'last_fulfillment_at', type: 'date', nullable: true })
  lastFulfillmentAt: string | null;

  @OneToMany(() => ProphecyFulfillment, (fulfillment) => fulfillment.prophecy, { cascade: true })
  fulfillments: ProphecyFulfillment[];
}
