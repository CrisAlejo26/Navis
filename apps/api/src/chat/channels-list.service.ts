import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ChannelListItem, ChannelsQuery } from '@navis/shared';
import { Repository } from 'typeorm';

import { ChannelMember } from './channel-member.entity';
import { toChannelListItem } from './channel.mapper';
import { ChannelStatsService } from './channel-stats.service';
import { ChatParticipantsService } from './chat-participants.service';

/**
 * La bandeja de Comunicaciones: los canales de esta cuenta en esta iglesia,
 * con el no leídos ya calculado (§5). `archived` decide si se ve la bandeja
 * normal o los archivados —personal o global, cualquiera de los dos (D2)—.
 */
@Injectable()
export class ChannelsListService {
  constructor(
    @InjectRepository(ChannelMember) private readonly members: Repository<ChannelMember>,
    private readonly stats: ChannelStatsService,
    private readonly participants: ChatParticipantsService,
  ) {}

  async list(churchId: string, userId: string, query: ChannelsQuery): Promise<ChannelListItem[]> {
    const wantsArchived = query.archived ?? false;

    const memberships = await this.members
      .createQueryBuilder('member')
      .innerJoinAndSelect('member.channel', 'channel')
      .where('member.userId = :userId', { userId })
      .andWhere('channel.churchId = :churchId', { churchId })
      .getMany();

    const visible = memberships.filter(
      (member) => wantsArchived === Boolean(member.archivedAt || member.channel.isArchived),
    );
    if (visible.length === 0) return [];

    const channelIds = visible.map((member) => member.channelId);
    const [unread, lastMessages, memberCounts, others] = await Promise.all([
      this.stats.unreadCounts(userId, channelIds),
      this.stats.lastMessages(channelIds),
      this.memberCounts(channelIds),
      this.othersOf(
        visible
          .filter((member) => member.channel.kind === 'individual')
          .map((member) => member.channelId),
        userId,
      ),
    ]);

    const users = await this.participants.usersById([
      ...[...lastMessages.values()].map((message) => message.authorId),
      ...[...others.values()],
    ]);

    const items = visible.map((membership) =>
      toChannelListItem({
        channel: membership.channel,
        membership,
        memberCount: memberCounts.get(membership.channelId) ?? 1,
        unreadCount: unread.get(membership.channelId) ?? 0,
        lastMessage: lastMessages.get(membership.channelId) ?? null,
        otherMember: (() => {
          const otherId = others.get(membership.channelId);
          return otherId ? (users.get(otherId) ?? null) : null;
        })(),
        users,
      }),
    );

    // Más reciente primero: por el último mensaje, o por creación si no hay ninguno.
    return items.sort((a, b) => {
      const at = a.lastMessage?.createdAt ?? '';
      const bt = b.lastMessage?.createdAt ?? '';
      return bt.localeCompare(at);
    });
  }

  private async memberCounts(channelIds: string[]): Promise<Map<string, number>> {
    const rows = await this.members
      .createQueryBuilder('member')
      .select('member.channelId', 'channelId')
      .addSelect('COUNT(*)', 'total')
      .where('member.channelId IN (:...channelIds)', { channelIds })
      .groupBy('member.channelId')
      .getRawMany<{ channelId: string; total: string }>();

    return new Map(rows.map((row) => [row.channelId, Number(row.total)]));
  }

  private async othersOf(channelIds: string[], userId: string): Promise<Map<string, string>> {
    if (channelIds.length === 0) return new Map();

    const rows = await this.members
      .createQueryBuilder('member')
      .select('member.channelId', 'channelId')
      .addSelect('member.userId', 'userId')
      .where('member.channelId IN (:...channelIds)', { channelIds })
      .andWhere('member.userId != :userId', { userId })
      .getRawMany<{ channelId: string; userId: string }>();

    return new Map(rows.map((row) => [row.channelId, row.userId]));
  }
}
