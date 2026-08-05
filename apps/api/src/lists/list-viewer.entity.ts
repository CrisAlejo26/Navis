import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';

/**
 * Un **acceso** del directorio de la iglesia (RFC 0010 D19, D22).
 *
 * **No es una cuenta**: no entra en `user`, no es Better Auth, no tiene rol ni
 * perfil ni correo. Es una llave de una puerta concreta, y lo único que puede
 * hacer es leer las listas que se le hayan concedido en `list_grants`.
 *
 * Los dos índices únicos son **planos** —el patrón de `gifts`— y el segundo da
 * «como mucho un acceso por creyente» sin impedir «tantos accesos de grupo como
 * haga falta», porque en los dos motores varios nulos no chocan entre sí.
 */
@Entity('list_viewers')
@Index('UQ_list_viewers_username', ['churchId', 'username'], { unique: true })
@Index('UQ_list_viewers_believer', ['churchId', 'believerId'], { unique: true })
export class ListViewer extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiPropertyOptional({ description: 'El creyente al que pertenece, si lo hay (D20)' })
  @Column({ name: 'believer_id', type: UUID, nullable: true })
  believerId: string | null;

  @ApiProperty({ description: 'Único por iglesia, minúsculas, de 3 a 40' })
  @Column({ type: 'text' })
  username: string;

  /** `scrypt$N$r$p$sal$clave` (D24). **Nunca en claro** y nunca en una respuesta. */
  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @ApiProperty({ example: 'Ancianos' })
  @Column({ type: 'text' })
  label: string;

  @ApiProperty({ description: 'Apagado no entra, y se conserva el historial' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Caducidad propia, aparte de la de la lista (D13)' })
  @Column({ name: 'expires_at', type: TIMESTAMP, nullable: true })
  expiresAt: Date | null;

  /**
   * Corta **al instante** las cookies emitidas antes (D28).
   *
   * Se toca al regenerar la contraseña, desactivar, borrar, quitar una concesión
   * y despublicar la lista. Lo que nadie espera al pulsar «Revocar» es que tarde
   * doce horas.
   */
  @Column({ name: 'sessions_valid_from', type: TIMESTAMP })
  sessionsValidFrom: Date;

  @ApiPropertyOptional({ description: 'Última entrada correcta' })
  @Column({ name: 'last_seen_at', type: TIMESTAMP, nullable: true })
  lastSeenAt: Date | null;

  /** El identificador de Better Auth es texto, no uuid (ver `CreateProfiles`). */
  @ApiProperty()
  @Column({ name: 'created_by', type: 'text' })
  createdBy: string;
}
