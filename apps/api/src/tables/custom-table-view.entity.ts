import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  type Relation,
} from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';
import type { CustomTable } from './custom-table.entity';

/**
 * Una vista guardada de una tabla: tablero o calendario (RFC 0021 D24).
 *
 * La vista de cuadrícula por defecto **no tiene fila**: se sintetiza en el
 * cliente y no se puede borrar. Sin `BaseEntity`: borrar la tabla se lleva sus
 * vistas por `ON DELETE CASCADE` y sin borrado lógico propio — una vista sin
 * su tabla no significa nada, a diferencia de una fila de datos.
 */
@Entity('custom_table_views')
export class CustomTableView {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column({ name: 'table_id', type: UUID })
  tableId: string;

  @ManyToOne('CustomTable', 'views', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: Relation<CustomTable>;

  @ApiProperty({ example: 'Por estado' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'kanban | calendar (D25)' })
  @Column({ type: 'text' })
  type: string;

  @ApiPropertyOptional({ description: 'La key de la columna de selección, en kanban' })
  @Column({ name: 'group_by', type: 'text', nullable: true })
  groupBy: string | null;

  @ApiPropertyOptional({ description: 'La key de la columna de fecha, en calendar' })
  @Column({ name: 'date_column', type: 'text', nullable: true })
  dateColumn: string | null;

  @ApiProperty({ description: '[{ columnKey, operator, value }] (D28, D30)' })
  @Column({ type: 'text', default: '[]' })
  filters: string;

  @ApiPropertyOptional({ description: 'key de columna; nulo ⇒ created_at' })
  @Column({ name: 'sort_by', type: 'text', nullable: true })
  sortBy: string | null;

  @ApiProperty({ description: 'asc | desc' })
  @Column({ name: 'sort_order', type: 'text', default: 'desc' })
  sortOrder: string;

  @ApiProperty({ description: 'Orden de las pestañas de vista' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: TIMESTAMP })
  updatedAt: Date;
}
