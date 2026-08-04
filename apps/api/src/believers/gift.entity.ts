import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_CONGREGATION_ACCENT } from '@navis/shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Un **don espiritual** del catálogo de la iglesia (RFC 0003 D5).
 *
 * Misma forma que una sede —nombre, color y orden— porque resuelve lo mismo:
 * distinguirlo de un vistazo sin que dos personas escriban «sanidad» y
 * «Sanidad» y acaben siendo dos dones distintos.
 *
 * Los siete de serie llevan `is_system` y no se borran: son el suelo común. Se
 * pueden renombrar y desactivar, porque el vocabulario es de cada iglesia.
 */
@Entity('gifts')
@Index('UQ_gifts_name', ['churchId', 'name'], { unique: true })
export class Gift extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ example: 'Sanidad' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Token de color o hexadecimal, como las sedes' })
  @Column({ type: 'text', default: DEFAULT_CONGREGATION_ACCENT })
  accent: string;

  @ApiProperty({ description: 'El orden en que se listan' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiProperty({ description: 'De serie: se renombra y se desactiva, no se borra' })
  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Apagado deja de proponerse, sin perder historial' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
