import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  CreateMessageInput,
  Message as MessageView,
  MessagesPage,
  MessagesQuery,
  UpdateMessageInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { ChannelAccessService } from './channel-access.service';
import { CHAT_BROADCASTER, type ChatBroadcaster } from './chat-broadcaster';
import { ChatParticipantsService } from './chat-participants.service';
import { authorIdsOf, toMessageView } from './message.mapper';
import { Message } from './message.entity';

/**
 * Enviar, paginar, editar y borrar mensajes. Reacciones y reenvío viven en
 * sus propios servicios (RFC 0016 §6): son casos de uso que se apoyan en
 * este pero no lo engordan.
 *
 * Todas las lecturas van con `withDeleted()` / `withDeleted: true`: un
 * mensaje borrado sigue en el hilo como «Mensaje eliminado» (§3), así que
 * nunca se puede dejar que TypeORM lo filtre solo.
 */
@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    private readonly access: ChannelAccessService,
    private readonly participants: ChatParticipantsService,
    @Inject(CHAT_BROADCASTER) private readonly broadcaster: ChatBroadcaster,
  ) {}

  async send(
    churchId: string,
    userId: string,
    channelId: string,
    input: CreateMessageInput,
  ): Promise<MessageView> {
    const access = await this.access.requireMembership(churchId, userId, channelId);
    this.access.requireWriteAccess(access);

    const replyToId = await this.resolveReplyTo(channelId, input.replyToId);

    const message = await this.messages.save(
      this.messages.create({ channelId, authorId: userId, body: input.body, replyToId }),
    );

    const view = await this.getView(message.id);
    this.broadcaster.messageCreated(view);
    return view;
  }

  /** El historial hacia atrás desde `before`, nunca con `page`/`offset` (§3). */
  async page(
    churchId: string,
    userId: string,
    channelId: string,
    query: MessagesQuery,
  ): Promise<MessagesPage> {
    const { membership } = await this.access.requireMembership(churchId, userId, channelId);

    const builder = this.messages
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.attachments', 'attachment')
      .leftJoinAndSelect('message.reactions', 'reaction')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .leftJoinAndSelect('message.forwardedFrom', 'forwardedFrom')
      .where('message.channelId = :channelId', { channelId })
      .withDeleted()
      .orderBy('message.createdAt', 'DESC')
      .take(query.limit + 1);

    // Limpiar (D3): lo anterior al cursor deja de verse para quien limpió,
    // sin tocar la fila ni lo que ve el resto.
    if (membership.clearedAt) {
      builder.andWhere('message.createdAt > :clearedAt', { clearedAt: membership.clearedAt });
    }

    if (query.before) builder.andWhere('message.createdAt < :before', { before: query.before });

    const rows = await builder.getMany();
    const hasMore = rows.length > query.limit;
    const page = rows.slice(0, query.limit);

    const users = await this.participants.usersById(authorIdsOf(page));
    // Del más nuevo al más viejo para el cursor; del más viejo al más nuevo
    // para leer, que es como se pinta un hilo.
    const items = page.map((message) => toMessageView(message, users)).reverse();

    return { items, hasMore };
  }

  async edit(
    churchId: string,
    userId: string,
    messageId: string,
    input: UpdateMessageInput,
  ): Promise<MessageView> {
    const message = await this.requireOwnMessage(churchId, userId, messageId);
    message.body = input.body;
    message.editedAt = new Date();
    await this.messages.save(message);

    const view = await this.getView(message.id);
    this.broadcaster.messageUpdated(view);
    return view;
  }

  /** Borrado lógico: vacía el cuerpo y deja «Mensaje eliminado», sin quitar la fila. */
  async remove(churchId: string, userId: string, messageId: string): Promise<void> {
    const message = await this.requireOwnMessage(churchId, userId, messageId);
    message.body = null;
    await this.messages.softRemove(message);

    this.broadcaster.messageUpdated(await this.getView(message.id));
  }

  private async resolveReplyTo(channelId: string, replyToId?: string): Promise<string | null> {
    if (!replyToId) return null;

    const exists = await this.messages.exists({
      where: { channelId, id: replyToId },
      withDeleted: true,
    });
    if (!exists) throw new BadRequestException('Ese mensaje no existe en esta conversación');

    return replyToId;
  }

  private async requireOwnMessage(
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
    if (message.authorId !== userId) {
      throw new ForbiddenException('Solo puedes editar o borrar tus propios mensajes');
    }

    return message;
  }

  /** Reconstruye la vista de un mensaje ya guardado. La usan reacciones y reenvío. */
  async getView(messageId: string): Promise<MessageView> {
    const message = await this.messages.findOne({
      where: { id: messageId },
      relations: { attachments: true, reactions: true, replyTo: true, forwardedFrom: true },
      withDeleted: true,
    });
    if (!message) throw new NotFoundException('Ese mensaje ya no existe');

    const users = await this.participants.usersById(authorIdsOf([message]));
    return toMessageView(message, users);
  }
}
