import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_CONGREGATION_ACCENT } from '@navis/shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Una **labor** del catálogo de la iglesia: para qué está disponible alguien.
 *
 * Misma forma que un don —nombre, color y orden— más el `slug`, que es lo que
 * de verdad se guarda en la persona (`believer_ministries.ministry`) y lo que
 * el calendario casa contra `calendars.ministry`. Por eso el catálogo se puede
 * cambiar entero sin tocar ni una programación: aquí vive **cómo se llama y de
 * qué color es** una labor, no quién la tiene.
 *
 * Las siete de serie llevan `is_system` y no se borran: son el suelo común. Se
 * pueden renombrar y desactivar, porque el vocabulario es de cada iglesia.
 */
@Entity('ministries')
@Index('UQ_ministries_slug', ['churchId', 'slug'], { unique: true })
@Index('UQ_ministries_name', ['churchId', 'name'], { unique: true })
export class Ministry extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ description: 'Lo que se guarda en la persona y mira el calendario' })
  @Column({ type: 'text' })
  slug: string;

  @ApiProperty({ example: 'Púlpito' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Token de color o hexadecimal, como los dones' })
  @Column({ type: 'text', default: DEFAULT_CONGREGATION_ACCENT })
  accent: string;

  @ApiProperty({ description: 'El orden en que se listan' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiProperty({ description: 'De serie: se renombra y se desactiva, no se borra' })
  @Column({ name: 'is_system', type: 'boolean', default: false })
  isSystem: boolean;

  @ApiProperty({ description: 'Apagada deja de proponerse, sin perder historial' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
