import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SUPERADMIN_ROLE, type RoleSlug } from '@navis/shared';
import { Repository } from 'typeorm';

import { ChannelAccessService } from './channel-access.service';
import { ChannelMember } from './channel-member.entity';
import { Channel } from './channel.entity';
import { CHAT_BROADCASTER, type ChatBroadcaster } from './chat-broadcaster';
import { NOW } from '../database/column-types';

/**
 * Archivar, limpiar y marcar como leído: los tres cursores por persona de
 * `ChannelMember` (RFC 0016 §3). Ninguno de los tres toca lo que ve el resto.
 */
@Injectable()
export class ChannelsArchiveService {
  constructor(
    @InjectRepository(Channel) private readonly channels: Repository<Channel>,
    @InjectRepository(ChannelMember) private readonly members: Repository<ChannelMember>,
    private readonly access: ChannelAccessService,
    @Inject(CHAT_BROADCASTER) private readonly broadcaster: ChatBroadcaster,
  ) {}

  /** Archivo personal (D2): sale de mi bandeja, sin avisar a nadie más. */
  async setPersonalArchive(
    churchId: string,
    userId: string,
    channelId: string,
    archived: boolean,
  ): Promise<void> {
    const { membership } = await this.access.requireMembership(churchId, userId, channelId);
    membership.archivedAt = archived ? new Date() : null;
    await this.members.save(membership);
  }

  /**
   * Archivo global (D2): lo pone un moderador y afecta a todo el mundo. Se
   * restringe además a pastor o superadministrador (RFC 0016 §13): más
   * estrecho que `communications.manage`, que también tienen `pulpito` y
   * `predicador-apoyo`.
   */
  async setGlobalArchive(
    churchId: string,
    userId: string,
    userRole: RoleSlug,
    channelId: string,
    archived: boolean,
  ): Promise<void> {
    const { channel, membership } = await this.access.requireMembership(
      churchId,
      userId,
      channelId,
    );
    this.access.requireModerator({ channel, membership });

    if (userRole !== 'pastor' && userRole !== SUPERADMIN_ROLE) {
      throw new ForbiddenException('Solo el pastor o un superadministrador archivan para todos');
    }

    channel.isArchived = archived;
    await this.channels.save(channel);
  }

  /**
   * Limpiar (D3): cursor `clearedAt`, como `lastReadAt`. No borra nada para
   * el resto. El valor lo pone la base de datos, no `new Date()`: es lo que
   * evita el mismo desfase de reloj que `markRead` (ver su comentario).
   */
  async clearHistory(churchId: string, userId: string, channelId: string): Promise<void> {
    const { membership } = await this.access.requireMembership(churchId, userId, channelId);
    await this.members.update(membership.id, { clearedAt: () => NOW });
  }

  /**
   * El cursor lo pone el reloj de la base de datos con `NOW()`/`CURRENT_TIMESTAMP`,
   * no `new Date()` de Node: `message.createdAt` también sale del reloj de la
   * base de datos (`@CreateDateColumn`), y en Windows la resolución del reloj
   * de Node puede quedar por detrás del suyo. Con dos relojes distintos, un
   * mensaje marcado como leído justo al llegar podía compararse con un
   * `lastReadAt` que en realidad era anterior, y seguía contando como no
   * leído.
   */
  async markRead(churchId: string, userId: string, channelId: string): Promise<void> {
    const { membership } = await this.access.requireMembership(churchId, userId, channelId);
    await this.members.update(membership.id, { lastReadAt: () => NOW });

    this.broadcaster.channelRead(channelId, userId);
  }

  /** Silenciar (RFC 0006: obligatorio desde el primer día). `until: null` quita el silencio. */
  async setMuted(
    churchId: string,
    userId: string,
    channelId: string,
    until: Date | null,
  ): Promise<void> {
    const { membership } = await this.access.requireMembership(churchId, userId, channelId);
    membership.mutedUntil = until;
    await this.members.save(membership);
  }
}
