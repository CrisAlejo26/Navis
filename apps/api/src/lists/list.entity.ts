import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DEFAULT_CONGREGATION_ACCENT, type ListVisibility } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import { ListMember } from './list-member.entity';

/**
 * Una **lista**: un conjunto ordenado de creyentes de la iglesia (RFC 0010 D1).
 *
 * Es de la iglesia y no de la sede —el equipo de sonido de una iglesia con tres
 * sedes es uno y la gente rota—, así que lleva `church_id`, `ActiveChurchGuard`
 * y permisos de rol, como el calendario y los creyentes.
 *
 * `visibility` es **la** fuente de verdad del estado de publicación (D9);
 * `share_token` es el secreto, no el estado. Los dos se escriben en el mismo
 * servicio y en la misma transacción.
 */
@Entity('lists')
@Index('UQ_lists_slug', ['churchId', 'slug'], { unique: true })
@Index('UQ_lists_name', ['churchId', 'name'], { unique: true })
export class List extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ example: 'Púlpito' })
  @Column({ type: 'text' })
  name: string;

  @ApiProperty({ description: 'Fijo desde el alta: renombrar no rompe un enlace (D7)' })
  @Column({ type: 'text' })
  slug: string;

  @ApiPropertyOptional({ description: 'Sale en la tarjeta de WhatsApp' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Token de color o hexadecimal: tiñe toda la sección (D37)' })
  @Column({ type: 'text', default: DEFAULT_CONGREGATION_ACCENT })
  accent: string;

  @ApiProperty({ description: 'El orden en la barra lateral' })
  @Column({ type: 'int', default: 0 })
  position: number;

  @ApiProperty({ description: 'Apagada sale de la barra, no se borra' })
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ description: 'private | link | restricted (D9)' })
  @Column({ type: 'text', default: 'private' })
  visibility: ListVisibility;

  @ApiPropertyOptional({ description: 'El secreto del enlace. Nulo si no está publicada (D10)' })
  @Index('UQ_lists_token', { unique: true })
  @Column({ name: 'share_token', type: 'text', nullable: true })
  shareToken: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'shared_at', type: TIMESTAMP, nullable: true })
  sharedAt: Date | null;

  @ApiPropertyOptional({ description: 'Nulo ⇒ sin caducidad (D13)' })
  @Column({ name: 'share_expires_at', type: TIMESTAMP, nullable: true })
  shareExpiresAt: Date | null;

  @ApiProperty({ description: 'Qué campos opcionales salen en público, en JSON (D16)' })
  @Column({ name: 'public_fields', type: 'text', default: '{}' })
  publicFields: string;

  /**
   * Apagado de serie, como la foto (D16): que se vea la lista en una página es
   * una cosa, y que se guarde y se reenvíe un fichero con los nombres de la
   * congregación es otra. Se enciende a mano al publicar.
   */
  @ApiProperty({ description: 'Si la página pública deja descargar el cartel' })
  @Column({ name: 'allow_download', type: 'boolean', default: false })
  allowDownload: boolean;

  @ApiPropertyOptional({ description: 'La portada de la tarjeta, en disco (D18)' })
  @Column({ name: 'cover_key', type: 'text', nullable: true })
  coverKey: string | null;

  /** Texto y nulable: las cinco de serie las siembra la migración, sin autor. */
  @ApiPropertyOptional()
  @Column({ name: 'created_by', type: 'text', nullable: true })
  createdBy: string | null;

  @OneToMany(() => ListMember, (member) => member.list)
  members: ListMember[];
}
