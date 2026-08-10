import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { TIMESTAMP, UUID } from '../database/column-types';
import type { Channel } from './channel.entity';
import { MessageAttachment } from './message-attachment.entity';
import { MessageReaction } from './message-reaction.entity';

/**
 * Un mensaje. `body` es `null` cuando el mensaje es solo un adjunto.
 *
 * `replyToId` y `forwardedFromId` apuntan a otro mensaje pero **no** llevan
 * `onDelete: 'CASCADE'`: si el original se borra (lógicamente) o el canal de
 * origen deja de ser visible, la cita o el reenvío deben seguir leyéndose
 * (D4). Por eso son `SET NULL` y el servicio guarda ya un recorte del
 * original en vez de resolverlo cada vez.
 */
@Entity('messages')
@Index('IDX_messages_channel', ['channelId', 'createdAt'])
export class Message extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'channel_id', type: UUID })
  channelId: string;

  /* Por nombre y con `Relation<>`: ver `list-member.entity.ts`. */
  @ManyToOne('Channel', 'messages', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'channel_id' })
  channel: Relation<Channel>;

  @ApiProperty({ description: 'ID del usuario en Better Auth' })
  @Column({ name: 'author_id', type: 'text' })
  authorId: string;

  @ApiPropertyOptional({ description: 'null si el mensaje es solo adjunto(s)' })
  @Column({ type: 'text', nullable: true })
  body: string | null;

  @ApiPropertyOptional()
  @Column({ name: 'reply_to_id', type: UUID, nullable: true })
  replyToId: string | null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reply_to_id' })
  replyTo: Relation<Message> | null;

  @ApiPropertyOptional({ description: 'Para la etiqueta «Reenviado» (D4)' })
  @Column({ name: 'forwarded_from_id', type: UUID, nullable: true })
  forwardedFromId: string | null;

  @ManyToOne(() => Message, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'forwarded_from_id' })
  forwardedFrom: Relation<Message> | null;

  @ApiPropertyOptional()
  @Column({ name: 'edited_at', type: TIMESTAMP, nullable: true })
  editedAt: Date | null;

  @OneToMany(() => MessageAttachment, (attachment) => attachment.message, { cascade: true })
  attachments: MessageAttachment[];

  @OneToMany(() => MessageReaction, (reaction) => reaction.message, { cascade: true })
  reactions: MessageReaction[];
}
