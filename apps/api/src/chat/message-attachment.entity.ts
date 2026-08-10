import { ApiProperty } from '@nestjs/swagger';
import type { MessageAttachmentKind } from '@navis/shared';
import { Column, Entity, Index, JoinColumn, ManyToOne, type Relation } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity';
import { UUID } from '../database/column-types';
import type { Message } from './message.entity';

/**
 * Un adjunto de un mensaje: imagen o archivo. **El fichero no está aquí**,
 * como los audios de una nota (`note-audio.entity.ts`): vive en disco, bajo
 * `UPLOADS_PATH`, y esta fila es su ficha.
 *
 * `original_name` es el nombre real, para la descarga: `storage_key` nunca
 * lleva el que mandó el cliente (CLAUDE.md).
 */
@Entity('message_attachments')
@Index('IDX_message_attachments_message', ['messageId'])
export class MessageAttachment extends BaseEntity {
  @ApiProperty()
  @Column({ name: 'message_id', type: UUID })
  messageId: string;

  /* Por nombre y con `Relation<>`: ver `note-audio.entity.ts`. */
  @ManyToOne('Message', 'attachments', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Relation<Message>;

  @ApiProperty({ example: 'archivo' })
  @Column({ type: 'text' })
  kind: MessageAttachmentKind;

  @ApiProperty({ description: 'El nombre del fichero en disco, generado aquí' })
  @Column({ name: 'storage_key', type: 'text' })
  storageKey: string;

  @ApiProperty({ description: 'El nombre real, para que la descarga lo conserve' })
  @Column({ name: 'original_name', type: 'text' })
  originalName: string;

  @ApiProperty({ example: 'application/pdf' })
  @Column({ name: 'mime_type', type: 'text' })
  mimeType: string;

  @ApiProperty()
  @Column({ name: 'size_bytes', type: 'int' })
  sizeBytes: number;
}
