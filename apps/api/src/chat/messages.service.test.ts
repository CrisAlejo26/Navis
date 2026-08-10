import { ForbiddenException } from '@nestjs/common';
import type { Message as MessageView } from '@navis/shared';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { ChannelAccessService } from './channel-access.service';
import type { ChatBroadcaster } from './chat-broadcaster';
import type { ChatParticipantsService } from './chat-participants.service';
import type { Message } from './message.entity';
import { MessagesService } from './messages.service';

/** Doble mínimo: solo lo que usa `MessagesService` (Regla 10). */
function build(existing: Partial<Message>[]) {
  const rows = existing.map(
    (row) =>
      ({
        attachments: [],
        reactions: [],
        channel: { churchId: 'c1' },
        createdAt: new Date('2026-08-10T12:00:00Z'),
        ...row,
      }) as Message,
  );
  const saved: Partial<Message>[] = [];
  const save = vi.fn((data: Partial<Message>) => {
    const withId = { id: data.id ?? `m${String(rows.length + saved.length + 1)}`, ...data };
    saved.push(withId);
    const index = rows.findIndex((row) => row.id === withId.id);
    if (index >= 0) rows[index] = { ...rows[index], ...withId };
    else rows.push(withId as Message);
    return Promise.resolve(withId);
  });
  const softRemove = vi.fn((row: Message) => {
    row.deletedAt = new Date();
    return Promise.resolve(row);
  });

  const messages = {
    create: (data: Partial<Message>) => data,
    save,
    softRemove,
    findOne: vi.fn(({ where }: { where: { id: string } }) =>
      Promise.resolve(rows.find((row) => row.id === where.id) ?? null),
    ),
    exists: vi.fn(({ where }: { where: { id: string } }) =>
      Promise.resolve(rows.some((row) => row.id === where.id)),
    ),
  } as unknown as Repository<Message>;

  const access = new ChannelAccessService({} as unknown as never, {} as unknown as never);
  const requireMembership = vi.spyOn(access, 'requireMembership').mockResolvedValue({
    channel: { churchId: 'c1' } as never,
    membership: {} as never,
  });

  const participants = {
    usersById: vi.fn().mockResolvedValue(new Map()),
  } as unknown as ChatParticipantsService;

  const messageUpdated = vi.fn();
  const broadcaster: ChatBroadcaster = {
    messageCreated: vi.fn(),
    messageUpdated,
    channelRead: vi.fn(),
    typing: vi.fn(),
    memberLeft: vi.fn(),
  };

  const service = new MessagesService(messages, access, participants, broadcaster);
  return { service, save, softRemove, requireMembership, access, messageUpdated, saved };
}

describe('MessagesService', () => {
  it('un miembro no puede escribir en un canal de aviso', async () => {
    const { service, access } = build([]);
    vi.spyOn(access, 'requireWriteAccess').mockImplementation(() => {
      throw new ForbiddenException('Solo quien modera puede escribir avisos');
    });

    await expect(service.send('c1', 'u1', 'ch1', { body: 'hola' })).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('borrar deja «Mensaje eliminado»: vacía el cuerpo sin quitar la fila', async () => {
    const { service, softRemove, messageUpdated } = build([
      { id: 'm1', channelId: 'ch1', authorId: 'u1', body: 'hola', deletedAt: null },
    ]);

    await service.remove('c1', 'u1', 'm1');

    expect(softRemove).toHaveBeenCalledTimes(1);
    const view: MessageView = messageUpdated.mock.calls[0]?.[0];
    expect(view.body).toBeNull();
    expect(view.deletedAt).not.toBeNull();
  });

  it('solo el autor puede borrar su mensaje', async () => {
    const { service } = build([
      { id: 'm1', channelId: 'ch1', authorId: 'otra-cuenta', body: 'hola', deletedAt: null },
    ]);

    await expect(service.remove('c1', 'u1', 'm1')).rejects.toThrow(ForbiddenException);
  });
});
