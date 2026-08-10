import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { ChannelAccessService } from './channel-access.service';
import type { ChatBroadcaster } from './chat-broadcaster';
import type { Message } from './message.entity';
import type { MessageAttachment } from './message-attachment.entity';
import { MessageForwardService } from './message-forward.service';
import type { MessagesService } from './messages.service';

describe('MessageForwardService', () => {
  it('reenviar copia el cuerpo y los adjuntos, y marca forwardedFromId (D4)', async () => {
    const original = {
      id: 'm1',
      channelId: 'ch1',
      authorId: 'u1',
      body: 'hola',
      deletedAt: null,
      channel: { churchId: 'c1' },
      attachments: [
        {
          id: 'a1',
          kind: 'archivo',
          storageKey: 'k1',
          originalName: 'n.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 10,
        },
      ] as MessageAttachment[],
    } as unknown as Message;

    const saved: Partial<Message>[] = [];
    const messages = {
      findOne: vi.fn().mockResolvedValue(original),
      create: (data: Partial<Message>) => data,
      save: vi.fn((data: Partial<Message>) => {
        const withId = { id: 'm2', ...data };
        saved.push(withId);
        return Promise.resolve(withId);
      }),
    } as unknown as Repository<Message>;

    const savedAttachments: Partial<MessageAttachment>[] = [];
    const attachments = {
      create: (data: Partial<MessageAttachment>) => data,
      save: vi.fn((data: Partial<MessageAttachment>) => {
        savedAttachments.push(data);
        return Promise.resolve(data);
      }),
    } as unknown as Repository<MessageAttachment>;

    const access = new ChannelAccessService({} as never, {} as never);
    vi.spyOn(access, 'requireMembership').mockResolvedValue({
      channel: { kind: 'grupo' } as never,
      membership: {} as never,
    });
    vi.spyOn(access, 'requireWriteAccess').mockImplementation(() => undefined);

    const messageCreated = vi.fn();
    const broadcaster: ChatBroadcaster = {
      messageCreated,
      messageUpdated: vi.fn(),
      channelRead: vi.fn(),
      typing: vi.fn(),
      memberLeft: vi.fn(),
    };

    const messagesService = {
      getView: vi.fn((id: string) => Promise.resolve({ id, forwardedFromId: 'm1' })),
    } as unknown as MessagesService;

    const service = new MessageForwardService(
      messages,
      attachments,
      access,
      messagesService,
      broadcaster,
    );

    await service.forward('c1', 'u1', 'm1', ['ch2']);

    expect(saved).toHaveLength(1);
    expect(saved[0]?.forwardedFromId).toBe('m1');
    expect(saved[0]?.body).toBe('hola');
    expect(savedAttachments).toHaveLength(1);
    expect(savedAttachments[0]?.storageKey).toBe('k1');
    expect(messageCreated).toHaveBeenCalledTimes(1);
  });
});
