import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Un **calendario**: un espacio de programación completo (RFC 0002 D15).
 *
 * Púlpito, recepción, sonido y biblias no comparten cuadrícula, así que cada
 * uno tiene el suyo con sus reuniones fijas y sus programaciones. Lo que
 * comparten es la iglesia, sus sedes y sus personas.
 *
 * `ministry` es lo que filtra el selector de personas (D16); nulo significa
 * «propón a cualquiera».
 */
@Entity('calendars')
// Parcial: sin el `WHERE`, borrar «Ofrenda» y crear otra con el mismo nombre
// chocaría con la fila borrada, que sigue en la tabla (D `PartialUniqueSlugs`).
@Index('UQ_calendars_slug', ['churchId', 'slug'], { unique: true, where: '"deleted_at" IS NULL' })
export class Calendar extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ example: 'Púlpito' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Derivado del nombre; es lo que va en la URL', example: 'pulpito' })
  @Column({ type: 'text' })
  slug: string;

  @ApiPropertyOptional({ description: 'A quién propone el selector', example: 'pulpito' })
  @Column({ type: 'text', nullable: true })
  ministry: string | null;

  @ApiProperty({ description: 'El orden en la barra lateral' })
  @Column({ type: 'int', default: 0 })
  position: number;
}
