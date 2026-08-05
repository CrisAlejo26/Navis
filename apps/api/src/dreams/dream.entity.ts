import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { DreamAudio } from './dream-audio.entity';
import { DreamEmotion } from './dream-emotion.entity';

/**
 * Un sueño (RFC 0005 §5.1).
 *
 * **No lleva `church_id`, y es a propósito** (D1). Como la profecía del RFC
 * 0004: lo que se sueña es de quien lo sueña, y si mañana entra en otra iglesia
 * —o en ninguna— sus sueños siguen siendo los suyos.
 *
 * Tampoco hay columna de estado: se deriva de la interpretación y de la fecha
 * de cumplimiento (D8). Y el cumplimiento son dos columnas y no una tabla hija,
 * al revés que en profecías, porque un sueño pasó o no pasó: no se cumple a
 * trozos (D9).
 */
@Entity('dreams')
@Index('IDX_dreams_owner_dreamed', ['ownerId', 'dreamedAt'])
@Index('IDX_dreams_owner_fulfilled', ['ownerId', 'fulfilledAt'])
@Index('IDX_dreams_owner_search', ['ownerId', 'searchText'])
export class Dream extends BaseEntity {
  @ApiProperty({ description: 'De quién es. La única barrera de acceso que hay (D1)' })
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;

  @ApiPropertyOptional({ description: 'Opcional: a las cuatro de la mañana nadie titula (D17)' })
  @Column({ type: 'text', nullable: true })
  title: string | null;

  @ApiProperty({ description: 'El sueño tal y como se recuerda. Texto plano' })
  @Column({ type: 'text' })
  body: string;

  @ApiProperty({ description: 'Título, cuerpo e interpretación, sin acentos (§6.1)' })
  @Column({ name: 'search_text', type: 'text' })
  searchText: string;

  @ApiProperty({ description: 'La noche en que se soñó', example: '2026-03-14' })
  @Column({ name: 'dreamed_at', type: 'date' })
  dreamedAt: string;

  @ApiPropertyOptional({ description: 'La posible interpretación. Se escribe después' })
  @Column({ type: 'text', nullable: true })
  interpretation: string | null;

  @ApiPropertyOptional({ description: 'Cuándo se cumplió. Nulo ⇒ no ha pasado (D8)' })
  @Column({ name: 'fulfilled_at', type: 'date', nullable: true })
  fulfilledAt: string | null;

  @ApiPropertyOptional({ description: 'Qué significó, escrito al cerrarlo (D10)' })
  @Column({ name: 'fulfillment_meaning', type: 'text', nullable: true })
  fulfillmentMeaning: string | null;

  @OneToMany(() => DreamEmotion, (link) => link.dream, { cascade: true })
  emotions: DreamEmotion[];

  @OneToMany(() => DreamAudio, (audio) => audio.dream)
  audios: DreamAudio[];
}
