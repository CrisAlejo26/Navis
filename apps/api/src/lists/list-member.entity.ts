import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';
import type { List } from './list.entity';

/**
 * Un **miembro**: un creyente dentro de una lista, en una posición (RFC 0010
 * §6.2, D2).
 *
 * Clave primaria compuesta y sin `BaseEntity`: es una tabla puente y la misma
 * persona no puede estar dos veces en la misma lista. Al borrar un creyente no
 * se borra su fila —el borrado es lógico—, así que la consulta filtra
 * `deleted_at` **por los dos lados** y, si se recupera, vuelve donde estaba.
 */
@Entity('list_members')
@Index('IDX_list_members_order', ['listId', 'position'])
export class ListMember {
  @PrimaryColumn({ name: 'list_id', type: UUID })
  listId: string;

  /*
   * El otro lado se referencia **por nombre** y el tipo va envuelto en
   * `Relation<>`: con la clase importada de verdad, `emitDecoratorMetadata` la
   * evalúa al cargar el módulo y el par padre-hijo se queda en un ciclo
   * («Cannot access 'List' before initialization»).
   */
  @ManyToOne('List', 'members', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'list_id' })
  list: Relation<List>;

  @ApiProperty()
  @Index('IDX_list_members_believer')
  @PrimaryColumn({ name: 'believer_id', type: UUID })
  believerId: string;

  @ApiProperty({ description: 'El orden dentro de la lista: en el púlpito, el orden es el dato' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiPropertyOptional({ example: 'Solo primer domingo' })
  @Column({ type: 'text', nullable: true })
  note: string | null;

  @CreateDateColumn({ name: 'added_at', type: TIMESTAMP })
  addedAt: Date;

  /** El identificador de Better Auth es texto, no uuid (ver `CreateProfiles`). */
  @Column({ name: 'added_by', type: 'text' })
  addedBy: string;
}
