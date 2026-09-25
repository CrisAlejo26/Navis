import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { CustomTable } from './custom-table.entity';

/**
 * Una fila de una tabla personalizada: un valor por columna, en JSON (RFC
 * 0021 D13).
 *
 * `data` es `text` con `JSON.stringify`, igual en los dos motores —como
 * `List.publicFields`—, y no el `jsonb` nativo de TypeORM, que se comporta
 * distinto en Postgres y en SQLite (CLAUDE.md). Se valida con zod al leer,
 * columna a columna con `rowValueMatchesType`, nunca con un `JSON.parse` a
 * pelo.
 */
@Entity('custom_table_rows')
@Index('IDX_custom_table_rows_page', ['tableId', 'createdAt'])
// Un creyente, una vez por tabla, sin contar las filas borradas ni las hechas
// a mano (RFC 0025 D9): el mismo patrón de únicos parciales que la propia
// tabla usa para su slug.
@Index('UQ_custom_table_rows_believer', ['tableId', 'believerId'], {
    unique: true,
    where: '"deleted_at" IS NULL AND "believer_id" IS NOT NULL',
})
export class CustomTableRow extends BaseEntity {
    @ApiProperty()
    @Index()
    @Column({ name: 'table_id', type: UUID })
    tableId: string;

    @ManyToOne('CustomTable', { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'table_id' })
    table: Relation<CustomTable>;

    @ApiProperty({ description: '{ [columnKey]: valor }, validado al leer (D13)' })
    @Column({ type: 'text' })
    data: string;

    @ApiPropertyOptional({
        description:
            'El creyente enlazado, sin clave ajena: la fila sobrevive a su baja (RFC 0025 D15)',
    })
    @Column({ name: 'believer_id', type: UUID, nullable: true })
    believerId: string | null;

    @ApiPropertyOptional({ description: 'Identificador de Better Auth' })
    @Column({ name: 'created_by', type: 'text', nullable: true })
    createdBy: string | null;
}
