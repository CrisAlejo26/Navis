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
 * La definición de una columna de una tabla personalizada (RFC 0021, «Las
 * columnas»).
 *
 * Sin `BaseEntity`: su borrado es siempre lógico con `is_active` (D10), nunca
 * con `deleted_at` — no hace falta la columna que `BaseEntity` añadiría de
 * más. `key` es estable desde el alta (D7): renombrar cambia `label`, nunca
 * `key`, así que renombrar no toca ni una fila de datos.
 *
 * El otro lado se referencia **por nombre** y con el tipo envuelto en
 * `Relation<>` (CLAUDE.md): con la clase importada de verdad,
 * `emitDecoratorMetadata` la evalúa al cargar el módulo y padre e hijo quedan
 * en un ciclo.
 */
@Entity('custom_table_columns')
@Index('UQ_custom_table_columns_key', ['tableId', 'key'], { unique: true })
export class CustomTableColumn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column({ name: 'table_id', type: UUID })
  tableId: string;

  @ManyToOne('CustomTable', 'columns', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_id' })
  table: Relation<CustomTable>;

  @ApiProperty({ description: 'Clave estable dentro del JSON de cada fila (D7)' })
  @Column({ type: 'text' })
  key: string;

  @ApiProperty({ example: 'Fecha de lectura' })
  @Column({ type: 'text' })
  label: string;

  @ApiProperty({ description: 'Uno de los doce tipos de columna' })
  @Column({ type: 'text' })
  type: string;

  @ApiProperty({ description: 'Orden de la columna (D8)' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiProperty({ description: 'Si el formulario exige un valor' })
  @Column({ type: 'boolean', default: false })
  required: boolean;

  @ApiPropertyOptional({ description: '[{ value, label, color? }] de selección única/múltiple' })
  @Column({ type: 'text', nullable: true })
  options: string | null;

  @ApiPropertyOptional({ description: 'Decimales, moneda, si la fecha lleva hora…' })
  @Column({ type: 'text', nullable: true })
  config: string | null;

  @ApiProperty({ description: 'Borrado lógico: no se pierde el valor en las filas (D10)' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: TIMESTAMP })
  updatedAt: Date;
}
