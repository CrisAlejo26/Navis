import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { describe, expect, it } from 'vitest';

import type { ChannelMember } from './channel-member.entity';
import type { Channel } from './channel.entity';
import { ChannelAccessService } from './channel-access.service';

function repoOf<T extends object>(
  rows: T[],
  match: (row: T, where: Record<string, unknown>) => boolean,
) {
  return {
    findOne: ({ where }: { where: Record<string, unknown> }) =>
      Promise.resolve(rows.find((row) => match(row, where)) ?? null),
  } as unknown as Repository<T>;
}

const channel = (over: Partial<Channel> = {}): Channel =>
  ({ id: 'ch1', churchId: 'c1', kind: 'grupo', ...over }) as Channel;

const member = (over: Partial<ChannelMember> = {}): ChannelMember =>
  ({ channelId: 'ch1', userId: 'u1', role: 'miembro', ...over }) as ChannelMember;

describe('el acceso a un canal', () => {
  it('un canal de otra iglesia no existe para quien pregunta', async () => {
    const channels = repoOf(
      [channel({ churchId: 'otra' })],
      (row, where) => row.id === where.id && row.churchId === where.churchId,
    );
    const members = repoOf([member()], () => true);
    const service = new ChannelAccessService(channels, members);

    await expect(service.requireMembership('c1', 'u1', 'ch1')).rejects.toThrow(NotFoundException);
  });

  it('quien no es miembro no distingue un canal ajeno de uno inexistente', async () => {
    const channels = repoOf(
      [channel()],
      (row, where) => row.id === where.id && row.churchId === where.churchId,
    );
    const members = repoOf([], () => false);
    const service = new ChannelAccessService(channels, members);

    await expect(service.requireMembership('c1', 'ajeno', 'ch1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('un miembro sin moderar no puede escribir en un canal de aviso', () => {
    const service = new ChannelAccessService(
      {} as Repository<Channel>,
      {} as Repository<ChannelMember>,
    );

    expect(() =>
      service.requireWriteAccess({ channel: channel({ kind: 'aviso' }), membership: member() }),
    ).toThrow(ForbiddenException);
  });

  it('quien modera sí puede escribir en un canal de aviso', () => {
    const service = new ChannelAccessService(
      {} as Repository<Channel>,
      {} as Repository<ChannelMember>,
    );

    expect(() =>
      service.requireWriteAccess({
        channel: channel({ kind: 'aviso' }),
        membership: member({ role: 'moderador' }),
      }),
    ).not.toThrow();
  });

  it('en un grupo, cualquier miembro puede escribir', () => {
    const service = new ChannelAccessService(
      {} as Repository<Channel>,
      {} as Repository<ChannelMember>,
    );

    expect(() =>
      service.requireWriteAccess({ channel: channel({ kind: 'grupo' }), membership: member() }),
    ).not.toThrow();
  });
});
