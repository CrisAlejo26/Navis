import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';

/**
 * Datos de dominio del usuario. La identidad (email, contraseña, sesiones)
 * vive en las tablas de Better Auth; aquí guardamos lo específico de
 * Fidus, enlazado por `user_id` con `"user"("id")`.
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

  @ApiProperty({ required: false, nullable: true })
  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ required: false, nullable: true })
  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @ApiProperty({ description: 'Zona horaria IANA', example: 'Europe/Madrid' })
  @Column({ type: 'text', default: 'Europe/Madrid' })
  timezone: string;
}
