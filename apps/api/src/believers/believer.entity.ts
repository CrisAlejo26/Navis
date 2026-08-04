import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import { BelieverMinistry } from './believer-ministry.entity';

/**
 * Una persona de la iglesia. Aquí está solo el **núcleo mínimo** que necesita
 * el calendario para poder programarle un turno (RFC 0002 §6): la ficha
 * completa —notas, familia, etiquetas, privacidad— llega con la RFC 0003
 * añadiendo columnas, sin rehacer nada de esto.
 *
 * Se asigna a un creyente y no a una cuenta (D8): quien predica no tiene por
 * qué tener usuario en Navis. `user_id` queda reservado para el día en que lo
 * tenga —«te toca el viernes» de la RFC 0006—, y hoy no lo usa nadie.
 */
@Entity('believers')
export class Believer extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiPropertyOptional({ description: 'Su sede habitual. No acota nada: solo ordena y etiqueta' })
  @Column({ name: 'congregation_id', type: UUID, nullable: true })
  congregationId: string | null;

  @ApiProperty({ example: 'Juan Carlos' })
  @Column({ name: 'first_name', type: 'text' })
  firstName: string;

  @ApiProperty({ example: 'Ruiz' })
  @Column({ name: 'last_name', type: 'text', default: '' })
  lastName: string;

  @ApiPropertyOptional({ description: 'Para avisar de un cambio de última hora' })
  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Quien ya no está deja de proponerse, sin borrar su historial' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Su cuenta, si la tiene. Reservado (RFC 0002 §6.3)' })
  @Column({ name: 'user_id', type: 'text', nullable: true })
  userId: string | null;

  @OneToMany(() => BelieverMinistry, (ministry) => ministry.believer, { cascade: true })
  ministries: BelieverMinistry[];
}
