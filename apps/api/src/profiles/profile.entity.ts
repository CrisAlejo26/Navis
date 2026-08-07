import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';

/**
 * Datos de dominio del usuario. La identidad (email, contraseña, sesiones)
 * vive en las tablas de Better Auth; aquí guardamos lo específico de
 * Navis, enlazado por `user_id` con `"user"("id")`.
 *
 * Es el ejemplo a copiar para cualquier entidad nueva que dependa del usuario.
 */
@Entity('profiles')
export class Profile extends BaseEntity {
  @ApiProperty({ description: 'ID del usuario en Better Auth' })
  @Index({ unique: true })
  @Column({ name: 'user_id', type: 'text' })
  userId: string;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Iglesia o congregación' })
  @Column({ type: 'text', nullable: true })
  church: string | null;

  @ApiProperty({ required: false, nullable: true, description: 'Ciudad para el tiempo del panel' })
  @Column({ type: 'text', nullable: true })
  city: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @ApiProperty({ description: 'Zona horaria IANA', example: 'Europe/Madrid' })
  @Column({ type: 'text', default: 'Europe/Madrid' })
  timezone: string;

  /**
   * En qué iglesia está trabajando ahora mismo (RFC 0008).
   *
   * Vive aquí y no en la tabla `user` de Better Auth a propósito: esa la
   * gestiona Better Auth y cachea la sesión en una cookie durante cinco
   * minutos, así que un cambio de iglesia tardaría ese rato en notarse.
   */
  @ApiProperty({ required: false, nullable: true, description: 'Iglesia activa' })
  @Column({ name: 'active_church_id', type: UUID, nullable: true })
  activeChurchId: string | null;

  /**
   * Solo tiene efecto para el rol `superadmin` (RFC 0014 D5-D6): con `true`
   * —el valor de serie—, ve únicamente sus propias iglesias y las cuentas de
   * sus miembros, igual que un pastor. En cualquier otra cuenta se guarda y no
   * se lee nunca: no vale la pena bifurcar el esquema por rol para una columna.
   */
  @ApiProperty({ description: 'Si el superadministrador ve solo lo suyo por defecto' })
  @Column({ name: 'restrict_own_scope', type: 'boolean', default: true })
  restrictOwnScope: boolean;
}
