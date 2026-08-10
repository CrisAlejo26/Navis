import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChannelMemberRole } from '@navis/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import type { Channel } from './channel.entity';

/**
 * La pertenencia de una cuenta a un canal, con sus tres cursores personales
 * (RFC 0016 §3): `lastReadAt` para los no leídos, `archivedAt` para el
 * archivo por persona (D2) y `clearedAt` para «limpiar» sin tocar lo que ve
 * el resto (D3). Los tres siguen el mismo patrón: una columna, no una tabla.
 */
@Entity('channel_members')
@Index('UQ_channel_members', ['channelId', 'userId'], { unique: true })
export class ChannelMember extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'channel_id', type: UUID })
  channelId: string;

  /* Por nombre y con `Relation<>`: ver `list-member.entity.ts`. */
  @ManyToOne('Channel', 'members', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Relation<Channel>;

  @ApiProperty({ description: 'ID del usuario en Better Auth' })
  @Index()
  @Column({ name: 'user_id', type: 'text' })
  userId: string;

  @ApiProperty()
  @Column({ type: 'text', default: 'miembro' })
  role: ChannelMemberRole;

  /**
   * Hasta cuándo ha leído. Nace en el momento de unirse —lo pone el
   * servicio al crear la fila, no aquí— y **no** es `@CreateDateColumn`: ese
   * decorador marca la columna como de solo alta, y TypeORM la excluye
   * calladamente de cualquier `UPDATE` — «marcar como leído» guardaba sin
   * avisar y el no leídos nunca bajaba.
   */
  @ApiProperty({ description: 'Hasta cuándo ha leído' })
  @Column({ name: 'last_read_at', type: TIMESTAMP })
  lastReadAt: Date;

  @ApiPropertyOptional({ description: 'Archivo personal (D2); `null` si no lo ha archivado' })
  @Column({ name: 'archived_at', type: TIMESTAMP, nullable: true })
  archivedAt: Date | null;

  @ApiPropertyOptional({ description: 'Cursor de «limpiar» (D3), como lastReadAt' })
  @Column({ name: 'cleared_at', type: TIMESTAMP, nullable: true })
  clearedAt: Date | null;

  @ApiPropertyOptional()
  @Column({ name: 'muted_until', type: TIMESTAMP, nullable: true })
  mutedUntil: Date | null;
}
