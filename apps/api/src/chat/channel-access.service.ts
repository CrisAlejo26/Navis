import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ChannelMember } from './channel-member.entity';
import { Channel } from './channel.entity';

export interface ChannelAccess {
  channel: Channel;
  membership: ChannelMember;
}

/**
 * La comprobación de acceso que comparten canales, mensajes, reacciones y
 * reenvíos: pertenecer al canal y, cuando hace falta, poder escribir en él.
 *
 * 404 y no 403 cuando no es miembro: un identificador de canal ajeno no debe
 * distinguirse de uno que no existe (mismo criterio que `NoteAudiosService`).
 */
@Injectable()
export class ChannelAccessService {
  constructor(
    @InjectRepository(Channel) private readonly channels: Repository<Channel>,
    @InjectRepository(ChannelMember) private readonly members: Repository<ChannelMember>,
  ) {}

  async requireMembership(
    churchId: string,
    userId: string,
    channelId: string,
  ): Promise<ChannelAccess> {
    const channel = await this.channels.findOne({ where: { id: channelId, churchId } });
    if (!channel) throw new NotFoundException('Esa conversación no existe en esta iglesia');

    const membership = await this.members.findOne({ where: { channelId, userId } });
    if (!membership) throw new NotFoundException('Esa conversación no existe en esta iglesia');

    return { channel, membership };
  }

  /** Un canal de aviso solo admite escribir a quien modera (RFC 0016 §1). */
  requireWriteAccess(access: ChannelAccess): void {
    if (access.channel.kind === 'aviso' && access.membership.role !== 'moderador') {
      throw new ForbiddenException('Solo quien modera puede escribir avisos');
    }
  }

  requireModerator(access: ChannelAccess): void {
    if (access.membership.role !== 'moderador') {
      throw new ForbiddenException('Hace falta moderar este canal');
    }
  }
}
