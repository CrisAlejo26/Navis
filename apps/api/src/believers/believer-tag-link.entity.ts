import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Believer } from './believer.entity';

/**
 * Quién tiene cuál (etiqueta de creyente).
 *
 * Misma forma que `believer_gifts` —tabla puente con las columnas de
 * `BaseEntity` y un índice único— y se resuelve igual: se borra y se vuelve a
 * escribir el juego entero, porque son cuatro filas y el índice ya impide
 * repetir.
 *
 * `featured` marca **la única que sale en la tabla del listado**: solo una por
 * persona, y la impone el servicio al guardar (una etiqueta destacada que ya no
 * está entre las suyas se cae aquí, no se valida en el cliente).
 */
@Entity('believer_tag_links')
@Index('UQ_believer_tag_links', ['believerId', 'tagId'], { unique: true })
export class BelieverTagLink extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'believer_id', type: UUID })
  believerId: string;

  /* Por nombre y con `Relation<>`: ver `calendar/pattern-phase.entity.ts`. */
  @ManyToOne('Believer', 'tagLinks', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'believer_id' })
  believer: Relation<Believer>;

  @ApiProperty()
  @Index()
  @Column({ name: 'tag_id', type: UUID })
  tagId: string;

  @ApiPropertyOptional({ description: 'La única que se muestra en la tabla del listado' })
  @Column({ type: 'boolean', default: false })
  featured: boolean;
}
