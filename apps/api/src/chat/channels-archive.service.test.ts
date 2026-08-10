import { ForbiddenException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { ChannelAccessService } from './channel-access.service';
import type { ChannelMember } from './channel-member.entity';
import type { Channel } from './channel.entity';
import { ChannelsArchiveService } from './channels-archive.service';
import type { ChatBroadcaster } from './chat-broadcaster';

function build(channel: Partial<Channel>, mine: Partial<ChannelMember>) {
  const channelRow = { id: 'ch1', kind: 'grupo', isArchived: false, ...channel } as Channel;
  const memberRow = {
    id: 'm1',
    channelId: 'ch1',
    userId: 'u1',
    archivedAt: null,
    clearedAt: null,
    mutedUntil: null,
    role: 'miembro',
    ...mine,
  } as ChannelMember;
  const otherRow = { ...memberRow, id: 'm2', userId: 'otro', archivedAt: null, clearedAt: null };

  const channels = {
    save: vi.fn((row: Channel) => Promise.resolve(row)),
  } as unknown as Repository<Channel>;

  const update = vi.fn().mockResolvedValue(undefined);
  const members = {
    save: vi.fn((row: ChannelMember) => Promise.resolve(row)),
    update,
  } as unknown as Repository<ChannelMember>;

  const access = new ChannelAccessService({} as never, {} as never);
  vi.spyOn(access, 'requireMembership').mockResolvedValue({
    channel: channelRow,
    membership: memberRow,
  });

  const channelRead = vi.fn();
  const broadcaster: ChatBroadcaster = {
    messageCreated: vi.fn(),
    messageUpdated: vi.fn(),
    channelRead,
    typing: vi.fn(),
    memberLeft: vi.fn(),
  };

  const service = new ChannelsArchiveService(channels, members, access, broadcaster);
  return { service, channelRow, memberRow, otherRow, channels, members, update, channelRead };
}

describe('ChannelsArchiveService', () => {
  it('archivar es personal: solo cambia mi fila, no la del otro miembro', async () => {
    const { service, memberRow, otherRow } = build({}, {});

    await service.setPersonalArchive('c1', 'u1', 'ch1', true);

    expect(memberRow.archivedAt).not.toBeNull();
    expect(otherRow.archivedAt).toBeNull();
  });

  it('limpiar toca solo mi fila (mi `id`), no la del otro miembro', async () => {
    const { service, memberRow, update } = build({}, {});

    await service.clearHistory('c1', 'u1', 'ch1');

    // El valor lo pone la base de datos (`NOW()`/`CURRENT_TIMESTAMP`), no
    // `new Date()`: por eso se comprueba la llamada y no un valor mutado.
    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(memberRow.id, { clearedAt: expect.any(Function) });
  });

  it('el archivo global lo rechaza quien no es pastor ni superadministrador', async () => {
    const { service } = build({}, { role: 'moderador' });

    await expect(service.setGlobalArchive('c1', 'u1', 'sonido', 'ch1', true)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('el pastor sí puede archivar un canal para todos', async () => {
    const { service, channelRow } = build({}, { role: 'moderador' });

    await service.setGlobalArchive('c1', 'u1', 'pastor', 'ch1', true);

    expect(channelRow.isArchived).toBe(true);
  });

  it('un moderador que no sea pastor tampoco, aunque modere el canal', async () => {
    const { service } = build({}, { role: 'moderador' });

    await expect(service.setGlobalArchive('c1', 'u1', 'pulpito', 'ch1', true)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('marcar como leído toca solo mi fila y avisa al broadcaster', async () => {
    const { service, memberRow, update, channelRead } = build({}, {});

    await service.markRead('c1', 'u1', 'ch1');

    expect(update).toHaveBeenCalledWith(memberRow.id, { lastReadAt: expect.any(Function) });
    expect(channelRead).toHaveBeenCalledWith('ch1', 'u1');
  });
});
