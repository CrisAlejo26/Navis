import { ApiProperty } from '@nestjs/swagger';
import { DEFAULT_CONGREGATION_ACCENT } from '@navis/shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Una **etiqueta de creyente** del catálogo de la iglesia.
 *
 * Misma forma que un don —nombre, color y orden— porque resuelve lo mismo:
 * distinguirla de un vistazo y que dos personas no escriban «En busca de
 * trabajo» y «en busca de trabajo» y acaben siendo dos etiquetas.
 *
 * No son las etiquetas de tareas y hábitos (`tags`, RFC 0018), que son de cada
 * cuenta: estas son del catálogo de la iglesia y se cuelgan de personas.
 *
 * El catálogo nace vacío y todo lo que se crea es de la iglesia (no hay de
 * serie), así que `is_system` queda siempre falso y `is_active` permite
 * apagarla sin perder a quien ya la tiene.
 */
@Entity('believer_tags')
@Index('UQ_believer_tags_name', ['churchId', 'name'], { unique: true })
export class BelieverTag extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ example: 'En busca de trabajo' })
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

  @ApiProperty({ description: 'Apagada deja de proponerse, sin perder historial' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
