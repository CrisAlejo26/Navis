import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Quién pertenece a qué iglesia.
 *
 * La pertenencia es **explícita**: sin fila, no hay acceso. Es lo contrario de
 * lo que hace Cuentify con sus empresas, y a propósito (RFC 0008 §4): aquí un
 * fallo del defecto no expone una factura, expone una conversación pastoral.
 *
 * El dueño de la iglesia también tiene la suya: así ninguna consulta necesita
 * dos caminos para responder «¿a qué iglesias llega esta cuenta?».
 */
@Entity('church_members')
@Index('UQ_church_members', ['churchId', 'userId'], { unique: true })
export class ChurchMember extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ description: 'ID del usuario en Better Auth' })
  @Index()
  @Column({ name: 'user_id', type: 'text' })
  userId: string;
}
