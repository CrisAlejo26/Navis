import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Una etiqueta: el vocabulario de tareas y hábitos de una cuenta, por iglesia
 * (RFC 0018 §5.1, D12). Mismo patrón que las emociones de sueños: cada cuenta
 * arma la suya, sin filas de serie.
 */
@Entity('tags')
@Index('UQ_tags_church_owner_name', ['churchId', 'ownerId', 'name'], { unique: true })
export class Tag extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ description: 'De quién es (D12)' })
  @Column({ name: 'owner_id', type: 'text' })
  ownerId: string;

  @ApiProperty()
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Clave del catálogo de iconos (D14)', example: 'book-open' })
  @Column({ type: 'text' })
  icon: string;

  @ApiProperty({ description: 'Token o hexadecimal de accentSchema (D13)' })
  @Column({ type: 'text' })
  accent: string;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  position: number;
}
