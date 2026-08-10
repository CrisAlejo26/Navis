import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { ChannelKind } from '@navis/shared';
import { Column, Entity, Index, OneToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import { ChannelMember } from './channel-member.entity';
import { Message } from './message.entity';

/**
 * Una conversación: individual, de grupo o de aviso (RFC 0016 §4, D1).
 *
 * `church_id` es lo que impide que dos iglesias en el mismo servidor vean los
 * canales de la otra; se comprueba en `ChatParticipantsService`, no aquí.
 * `is_archived` es el archivo **global** que pone un moderador (D2); el
 * archivo **personal** vive en `ChannelMember.archivedAt`.
 */
@Entity('channels')
export class Channel extends BaseEntity {
  @ApiProperty()
  @Index()
  @Column({ name: 'church_id', type: UUID })
  churchId: string;

  @ApiProperty({ example: 'grupo' })
  @Column({ type: 'text' })
  kind: ChannelKind;

  @ApiPropertyOptional({ description: 'null en «individual»: se pinta con la otra persona' })
  @Column({ type: 'text', nullable: true })
  name: string | null;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ description: 'Foto de grupo: la clave del fichero en disco' })
  @Column({ name: 'photo_key', type: 'text', nullable: true })
  photoKey: string | null;

  @ApiProperty({ description: 'Archivo global: lo puso un moderador (D2)' })
  @Column({ name: 'is_archived', type: 'boolean', default: false })
  isArchived: boolean;

  @ApiProperty({ description: 'ID del usuario en Better Auth que lo creó' })
  @Column({ name: 'created_by', type: 'text' })
  createdBy: string;

  @OneToMany(() => ChannelMember, (member) => member.channel, { cascade: true })
  members: ChannelMember[];

  @OneToMany(() => Message, (message) => message.channel, { cascade: true })
  messages: Message[];
}
