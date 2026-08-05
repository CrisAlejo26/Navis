import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';

/**
 * Una emoción del vocabulario de sueños (RFC 0005 §5.2).
 *
 * Hay dos clases de fila y se distinguen por `owner_id`, **sin columna
 * `is_system`** (D6): nula significa que es una de las doce de serie, y
 * entonces manda `slug`; con dueño es una emoción propia, y entonces manda
 * `name`.
 *
 * El porqué de que las de serie no guarden texto está en D4: si la migración
 * sembrara «persecución», quien use la aplicación en alemán leería
 * «persecución». El texto lo pone la interfaz a partir del `slug`, y así salen
 * en los seis idiomas. Las propias sí guardan el suyo, escrito por su dueño en
 * su idioma, y no las lee nadie más.
 */
@Entity('emotions')
@Index('UQ_emotions_slug', ['slug'], { unique: true, where: '"slug" IS NOT NULL' })
@Index('UQ_emotions_owner_name', ['ownerId', 'name'], { unique: true, where: '"name" IS NOT NULL' })
export class Emotion extends BaseEntity {
  @ApiPropertyOptional({ description: 'De quién es. Nulo ⇒ es una de las de serie (D6)' })
  @Index()
  @Column({ name: 'owner_id', type: 'text', nullable: true })
  ownerId: string | null;

  @ApiPropertyOptional({ description: 'Solo las de serie. Es lo que traduce la interfaz (D4)' })
  @Column({ type: 'text', nullable: true })
  slug: string | null;

  @ApiPropertyOptional({ description: 'Solo las propias. El texto de su dueño, tal cual' })
  @Column({ type: 'text', nullable: true })
  name: string | null;

  @ApiProperty({ description: 'Token de color o hexadecimal de ACCENT_PALETTE (D7)' })
  @Column({ type: 'text' })
  accent: string;

  @ApiProperty({ description: 'El orden en que se listan las de serie' })
  @Column({ type: 'int', default: 0 })
  position: number;
}
