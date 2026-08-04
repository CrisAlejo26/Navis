import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_CONGREGATION_ACCENT } from '@navis/shared';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Una **sede**: un lugar de reunión de la iglesia (RFC 0002 §5.1).
 *
 * No aísla nada. No tiene cuentas, ni permisos, ni creyentes propios: quien
 * entra a la iglesia ve todas sus sedes. Es lo que permite programar Benidorm,
 * Alicante y Elda el mismo viernes sin montar tres espacios de trabajo ni dar
 * de alta al mismo predicador tres veces. Si algún sitio necesita que su
 * equipo no vea lo de los demás, eso es una iglesia aparte (RFC 0008).
 *
 * Cada iglesia tiene siempre al menos una —la crea su migración—, y mientras
 * solo haya una la interfaz no la menciona.
 */
@Entity('congregations')
@Index('UQ_congregations_name', ['churchId', 'name'], { unique: true })
export class Congregation extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ example: 'Elda' })
  @Column({ type: 'text' })
  name: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  city: string | null;

  @ApiProperty({ description: 'Token de color con el que se distingue', example: 'success' })
  @Column({ type: 'text', default: DEFAULT_CONGREGATION_ACCENT })
  accent: string;

  @ApiProperty({ description: 'El orden en que se listan y se pintan' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiProperty({ description: 'La que se propone al crear algo' })
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @ApiProperty({ description: 'Una sede apagada deja de proponerse, sin perder su historial' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;
}
