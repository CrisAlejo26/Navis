import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Message as MessageView } from '@navis/shared';
import { Repository } from 'typeorm';

import { ChannelAccessService } from './channel-access.service';
import { CHAT_BROADCASTER, type ChatBroadcaster } from './chat-broadcaster';
import { MessageAttachment } from './message-attachment.entity';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';

/**
 * Reenviar (D4): un mensaje **nuevo** con `forwardedFromId` puesto, con el
 * cuerpo y los adjuntos copiados — no una referencia al original. Si el
 * original se borra o su canal deja de ser visible, el reenviado sigue
 * leyéndose.
 */
@Injectable()
export class MessageForwardService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(MessageAttachment)
    private readonly attachments: Repository<MessageAttachment>,
    private readonly access: ChannelAccessService,
    private readonly messagesService: MessagesService,
    @Inject(CHAT_BROADCASTER) private readonly broadcaster: ChatBroadcaster,
  ) {}

  async forward(
    churchId: string,
    userId: string,
    messageId: string,
    channelIds: readonly string[],
  ): Promise<MessageView[]> {
    const original = await this.messages.findOne({
      where: { id: messageId },
      relations: { channel: true, attachments: true },
      withDeleted: true,
    });
    if (!original || original.channel.churchId !== churchId) {
      throw new NotFoundException('Ese mensaje no existe en esta iglesia');
    }
    // Hace falta ser miembro del canal de origen para poder reenviar desde él.
    await this.access.requireMembership(churchId, userId, original.channelId);

    const results: MessageView[] = [];
    for (const channelId of new Set(channelIds)) {
      results.push(await this.forwardTo(churchId, userId, original, channelId));
    }

    return results;
  }

  private async forwardTo(
    churchId: string,
    userId: string,
    original: Message,
    channelId: string,
  ): Promise<MessageView> {
    const access = await this.access.requireMembership(churchId, userId, channelId);
    this.access.requireWriteAccess(access);

    const copy = await this.messages.save(
      this.messages.create({
        channelId,
        authorId: userId,
        body: original.deletedAt ? null : original.body,
        forwardedFromId: original.id,
      }),
    );

    if (!original.deletedAt) {
      for (const attachment of original.attachments) {
        // El fichero en disco se comparte entre las dos filas: es inmutable
        // una vez subido y nunca se borra al borrar un mensaje (§7), así que
        // no hace falta duplicarlo.
        await this.attachments.save(
          this.attachments.create({
            messageId: copy.id,
            kind: attachment.kind,
            storageKey: attachment.storageKey,
            originalName: attachment.originalName,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
          }),
        );
      }
    }

    const view = await this.messagesService.getView(copy.id);
    this.broadcaster.messageCreated(view);
    return view;
  }
}
