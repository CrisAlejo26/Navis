import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { CustomTableColumn } from './custom-table-column.entity';
import type { CustomTableView } from './custom-table-view.entity';

/**
 * Una **tabla personalizada**: nombre, icono, color y una rejilla de columnas
 * y filas que quien la usa define a su gusto (RFC 0021 D1).
 *
 * Es de la iglesia y no de la cuenta, como las listas (D1): llevar la
 * asistencia a la lectura de la Biblia es trabajo de la congregación, no de
 * quien lo anota.
 */
@Entity('custom_tables')
// Parciales: sin el `WHERE`, borrar una tabla y crear otra con el mismo
// nombre chocaría con la fila borrada, que sigue en la tabla (D
// `PartialUniqueSlugs`).
@Index('UQ_custom_tables_slug', ['churchId', 'slug'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
@Index('UQ_custom_tables_name', ['churchId', 'name'], {
  unique: true,
  where: '"deleted_at" IS NULL',
})
export class CustomTable extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ example: 'Asistencia a la lectura' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Fijo desde el alta, como en listas (D7)' })
  @Column({ type: 'text' })
  slug: string;

  @ApiProperty({ description: 'Clave de TASK_ICON_CATALOG (D4)' })
  @Column({ type: 'text' })
  icon: string;

  @ApiProperty({ description: 'Token o hexadecimal de ACCENT_PALETTE (D5)' })
  @Column({ type: 'text' })
  accent: string;

  @ApiProperty({ description: 'El orden en la barra lateral' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiProperty({ description: 'Apagada sale de la barra, no se borra (D6)' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional()
  @Column({ name: 'created_by', type: 'text', nullable: true })
  createdBy: string | null;

  @OneToMany('CustomTableColumn', 'table')
  columns: CustomTableColumn[];

  @OneToMany('CustomTableView', 'table')
  views: CustomTableView[];
}
