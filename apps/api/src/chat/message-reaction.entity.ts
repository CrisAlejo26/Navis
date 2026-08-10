import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  type Relation,
} from 'typeorm';

import { TIMESTAMP, UUID } from '../database/column-types';
import type { Message } from './message.entity';

/**
 * Una reacción. Clave primaria compuesta, sin `BaseEntity`, como
 * `list-member.entity.ts`: es una tabla puente.
 *
 * Varias reacciones por persona, una por emoji (D7): la persona puede dejar
 * `👍` y `❤️` en el mismo mensaje, nunca `👍` dos veces.
 */
@Entity('message_reactions')
export class MessageReaction {
  @PrimaryColumn({ name: 'message_id', type: UUID })
  messageId: string;

  /* Por nombre y con `Relation<>`: ver `list-member.entity.ts`. */
  @ManyToOne('Message', 'reactions', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Relation<Message>;

  @ApiProperty({ description: 'ID del usuario en Better Auth' })
  @Index()
  @PrimaryColumn({ name: 'user_id', type: 'text' })
  userId: string;

  @ApiProperty({ example: '👍' })
  @PrimaryColumn({ type: 'text' })
  emoji: string;

  @CreateDateColumn({ name: 'created_at', type: TIMESTAMP })
  createdAt: Date;
}
