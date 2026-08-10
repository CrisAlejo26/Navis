import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChannelAccessService } from './channel-access.service';
import { CHAT_BROADCASTER, type ChatBroadcaster } from './chat-broadcaster';
import { MessageReaction } from './message-reaction.entity';
import { Message } from './message.entity';
import { MessagesService } from './messages.service';

/**
 * Reaccionar. Varias reacciones por persona, una por emoji (D7):
 * `UNIQUE(messageId, userId, emoji)` hace que repetir la misma no truene, y
 * el servicio ni se molesta en comprobarlo antes.
 */
@Injectable()
export class MessageReactionsService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(MessageReaction) private readonly reactions: Repository<MessageReaction>,
    private readonly access: ChannelAccessService,
    private readonly messagesService: MessagesService,
    @Inject(CHAT_BROADCASTER) private readonly broadcaster: ChatBroadcaster,
  ) {}

  async react(churchId: string, userId: string, messageId: string, emoji: string): Promise<void> {
    const message = await this.requireMessage(churchId, userId, messageId);

    const exists = await this.reactions.exists({ where: { messageId: message.id, userId, emoji } });
    if (!exists) {
      await this.reactions.save(this.reactions.create({ messageId: message.id, userId, emoji }));
    }

    this.broadcaster.messageUpdated(await this.messagesService.getView(message.id));
  }

  async unreact(churchId: string, userId: string, messageId: string, emoji: string): Promise<void> {
    const message = await this.requireMessage(churchId, userId, messageId);
    await this.reactions.delete({ messageId: message.id, userId, emoji });

    this.broadcaster.messageUpdated(await this.messagesService.getView(message.id));
  }

  private async requireMessage(
    churchId: string,
    userId: string,
    messageId: string,
  ): Promise<Message> {
    const message = await this.messages.findOne({
      where: { id: messageId },
      relations: { channel: true },
      withDeleted: true,
    });
    if (!message || message.channel.churchId !== churchId) {
      throw new NotFoundException('Ese mensaje no existe en esta iglesia');
    }

    await this.access.requireMembership(churchId, userId, message.channelId);
    return message;
  }
}
