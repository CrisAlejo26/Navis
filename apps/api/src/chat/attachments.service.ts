import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isImageMimeType, type Message as MessageView } from '@navis/shared';
import type { ReadStream } from 'node:fs';
import { Repository } from 'typeorm';

import { churchScope } from '../media/file-storage.service';
import { DocumentStorageService, type UploadedDocument } from '../media/document-storage.service';
import { ImageStorageService } from '../media/image-storage.service';
import { ChannelAccessService } from './channel-access.service';
import { CHAT_BROADCASTER, type ChatBroadcaster } from './chat-broadcaster';
import { MessageAttachment } from './message-attachment.entity';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';

/** Lo que llega de multer, reducido a lo que de verdad se usa (Regla 10). */
export interface UploadedAttachment extends UploadedDocument {
  originalname: string;
}

/**
 * `busboy` (el analizador de multipart que usa multer) decodifica las
 * cabeceras como latin1 por defecto, así que un nombre con acentos llega
 * corrompido («reunión» → «reuniÃ³n»): son los mismos bytes UTF-8, leídos con
 * la tabla que no toca. Se reinterpretan una vez, aquí, antes de guardarlos.
 */
function fixFilenameEncoding(name: string): string {
  return Buffer.from(name, 'latin1').toString('utf8');
}

/**
 * Un mensaje que es (también) un adjunto: imagen o archivo (RFC 0016 §7).
 *
 * Escribir primero el fichero y después las filas es deliberado, como en
 * `NoteAudiosService`: si falla lo segundo queda un fichero huérfano
 * —recuperable, invisible—, mientras que al revés quedaría un mensaje que
 * apunta a nada.
 */
@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(MessageAttachment)
    private readonly attachments: Repository<MessageAttachment>,
    private readonly access: ChannelAccessService,
    private readonly images: ImageStorageService,
    private readonly documents: DocumentStorageService,
    private readonly messagesService: MessagesService,
    @Inject(CHAT_BROADCASTER) private readonly broadcaster: ChatBroadcaster,
  ) {}

  async upload(
    churchId: string,
    userId: string,
    channelId: string,
    file: UploadedAttachment,
    caption: { body?: string; replyToId?: string },
  ): Promise<MessageView> {
    const access = await this.access.requireMembership(churchId, userId, channelId);
    this.access.requireWriteAccess(access);

    if (caption.replyToId) {
      const exists = await this.messages.exists({
        where: { channelId, id: caption.replyToId },
        withDeleted: true,
      });
      if (!exists) throw new NotFoundException('Ese mensaje no existe en esta conversación');
    }

    const isImage = isImageMimeType(file.mimetype);
    const stored = isImage
      ? await this.images.save(churchScope(churchId), file)
      : await this.documents.save(churchScope(churchId), file);

    const message = await this.messages.save(
      this.messages.create({
        channelId,
        authorId: userId,
        body: caption.body ?? null,
        replyToId: caption.replyToId ?? null,
      }),
    );

    await this.attachments.save(
      this.attachments.create({
        messageId: message.id,
        kind: isImage ? 'imagen' : 'archivo',
        storageKey: stored.storageKey,
        originalName: fixFilenameEncoding(file.originalname),
        mimeType: stored.mimeType,
        sizeBytes: file.size,
      }),
    );

    const view = await this.messagesService.getView(message.id);
    this.broadcaster.messageCreated(view);
    return view;
  }

  /** El fichero para descargarlo, comprobando antes que es de esta iglesia. */
  async stream(
    churchId: string,
    id: string,
  ): Promise<{ attachment: MessageAttachment; file: ReadStream }> {
    const attachment = await this.attachments.findOne({
      where: { id },
      relations: { message: { channel: true } },
    });
    if (!attachment || attachment.message.channel.churchId !== churchId) {
      throw new NotFoundException('Ese adjunto no existe en esta iglesia');
    }

    const storage = attachment.kind === 'imagen' ? this.images : this.documents;
    return { attachment, file: storage.read(attachment.storageKey) };
  }
}
