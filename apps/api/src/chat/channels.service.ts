import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ChannelDetail, CreateChannelInput, UpdateChannelInput } from '@navis/shared';
import { Repository } from 'typeorm';

import { ChannelAccessService } from './channel-access.service';
import { ChannelMember } from './channel-member.entity';
import { Channel } from './channel.entity';
import { toChannelDetail, toChannelListItem } from './channel.mapper';
import { ChannelStatsService } from './channel-stats.service';
import { CHAT_BROADCASTER, type ChatBroadcaster } from './chat-broadcaster';
import { ChatParticipantsService } from './chat-participants.service';

/**
 * Crear, leer y renombrar canales. Listar vive en `ChannelsListService` y
 * archivar/limpiar en `ChannelsArchiveService`: son casos de uso distintos
 * sobre las mismas dos tablas, como ya separa `BelieversModule` sus propios
 * servicios (Regla 6).
 */
@Injectable()
export class ChannelsService {
  constructor(
    @InjectRepository(Channel) private readonly channels: Repository<Channel>,
    @InjectRepository(ChannelMember) private readonly members: Repository<ChannelMember>,
    private readonly access: ChannelAccessService,
    private readonly stats: ChannelStatsService,
    private readonly participants: ChatParticipantsService,
    @Inject(CHAT_BROADCASTER) private readonly broadcaster: ChatBroadcaster,
  ) {}

  /**
   * Crea una conversación, o reabre la que ya existiera: dos personas no
   * acumulan una conversación «individual» nueva cada vez que se buscan.
   */
  async create(
    churchId: string,
    userId: string,
    input: CreateChannelInput,
  ): Promise<ChannelDetail> {
    const memberIds = [...new Set(input.memberIds)].filter((id) => id !== userId);
    if (memberIds.length === 0) throw new BadRequestException('Elige con quién hablar');

    const eligible = await this.participants.areEligible(churchId, memberIds);
    if (!eligible) {
      throw new ForbiddenException('Alguna de esas cuentas no puede entrar a Comunicaciones');
    }

    if (input.kind === 'individual') {
      const existing = await this.findExistingIndividual(churchId, userId, memberIds[0] ?? '');
      if (existing) return this.get(churchId, userId, existing.id);
    }

    const channel = await this.channels.save(
      this.channels.create({
        churchId,
        kind: input.kind,
        name: input.kind === 'individual' ? null : (input.name ?? null),
        description: input.description ?? null,
        createdBy: userId,
      }),
    );

    // `lastReadAt` se pone aquí, explícito, y no se deja al valor por
    // defecto de la columna: Postgres lo aplica cuando la columna se omite
    // del INSERT, pero el driver de SQLite manda un `NULL` explícito para
    // toda propiedad sin valor, y `last_read_at` no admite nulos.
    //
    // Y se pone al **epoch**, no a `new Date()`: nadie ha leído nada
    // todavía, así que cualquier mensaje futuro debe contar como no leído.
    // Con «ahora» hubo un mensaje que llegaba en el mismo milisegundo que la
    // creación del canal —el flujo normal es crear y escribir enseguida— y
    // `message.createdAt > member.lastReadAt` daba falso por el empate: el
    // primer mensaje nacía ya leído.
    const neverRead = new Date(0);

    // Quien crea modera: en un aviso es quien puede escribir; en un grupo,
    // quien puede renombrarlo o sacar a alguien (D5).
    await this.members.save([
      this.members.create({
        channelId: channel.id,
        userId,
        role: 'moderador',
        lastReadAt: neverRead,
      }),
      ...memberIds.map((id) =>
        this.members.create({
          channelId: channel.id,
          userId: id,
          role: 'miembro',
          lastReadAt: neverRead,
        }),
      ),
    ]);

    return this.get(churchId, userId, channel.id);
  }

  async get(churchId: string, userId: string, channelId: string): Promise<ChannelDetail> {
    const { channel, membership } = await this.access.requireMembership(
      churchId,
      userId,
      channelId,
    );
    const members = await this.members.find({ where: { channelId } });

    const [unread, lastMessages] = await Promise.all([
      this.stats.unreadCounts(userId, [channelId]),
      this.stats.lastMessages([channelId]),
    ]);
    const lastMessage = lastMessages.get(channelId) ?? null;

    const other =
      channel.kind === 'individual' ? members.find((m) => m.userId !== userId) : undefined;
    const userIds = [
      ...members.map((m) => m.userId),
      ...(lastMessage ? [lastMessage.authorId] : []),
    ];
    const users = await this.participants.usersById(userIds);

    const listItem = toChannelListItem({
      channel,
      membership,
      memberCount: members.length,
      unreadCount: unread.get(channelId) ?? 0,
      lastMessage,
      otherMember: other ? (users.get(other.userId) ?? null) : null,
      users,
    });

    return toChannelDetail(listItem, channel, members, users);
  }

  /** Renombrar o cambiar la descripción. Un canal «individual» no se renombra. */
  async update(
    churchId: string,
    userId: string,
    channelId: string,
    input: UpdateChannelInput,
  ): Promise<ChannelDetail> {
    const { channel } = await this.access.requireMembership(churchId, userId, channelId);
    if (channel.kind === 'individual') {
      throw new BadRequestException('Una conversación individual no se renombra');
    }

    if (input.name !== undefined) channel.name = input.name;
    if (input.description !== undefined) channel.description = input.description;
    await this.channels.save(channel);

    return this.get(churchId, userId, channelId);
  }

  /**
   * Salir de un grupo o de un aviso. Una conversación «individual» no se
   * abandona: la fila se borra de verdad, no con `softRemove`, porque el
   * índice único `(channel_id, user_id)` no distingue una fila borrada de una
   * viva, y alguien podría volver a entrar más tarde.
   */
  async leave(churchId: string, userId: string, channelId: string): Promise<void> {
    const { channel } = await this.access.requireMembership(churchId, userId, channelId);
    if (channel.kind === 'individual') {
      throw new BadRequestException('Una conversación individual no se abandona');
    }

    await this.members.delete({ channelId, userId });
    this.broadcaster.memberLeft(channelId, userId);
  }

  private async findExistingIndividual(
    churchId: string,
    userId: string,
    otherId: string,
  ): Promise<Channel | null> {
    if (!otherId) return null;

    return this.channels
      .createQueryBuilder('channel')
      .innerJoin('channel.members', 'mine', 'mine.userId = :userId', { userId })
      .innerJoin('channel.members', 'theirs', 'theirs.userId = :otherId', { otherId })
      .where('channel.churchId = :churchId', { churchId })
      .andWhere('channel.kind = :kind', { kind: 'individual' })
      .getOne();
  }
}
