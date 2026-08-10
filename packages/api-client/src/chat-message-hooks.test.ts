import type { Message, MessagesPage } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { messagesPath, nextMessagesCursor } from './chat-message-hooks';

const mensaje = (id: string, createdAt: string): Message =>
  ({
    id,
    channelId: 'ch1',
    authorId: 'u1',
    authorName: 'Juan',
    authorImage: null,
    body: 'hola',
    replyTo: null,
    forwardedFrom: null,
    attachments: [],
    reactions: [],
    editedAt: null,
    deletedAt: null,
    createdAt,
  }) satisfies Message;

const pagina = (items: Message[], hasMore: boolean): MessagesPage => ({ items, hasMore });

describe('la paginación por cursor del historial', () => {
  it('la primera página no lleva `before`', () => {
    expect(messagesPath('ch1')).toBe('/channels/ch1/messages');
  });

  it('las siguientes llevan el cursor tal cual', () => {
    expect(messagesPath('ch1', '2026-08-10T12:00:00.000Z')).toBe(
      '/channels/ch1/messages?before=2026-08-10T12%3A00%3A00.000Z',
    );
  });

  it('si `hasMore` es true, el cursor es el `createdAt` del más viejo de la página', () => {
    const page = pagina(
      [mensaje('m1', '2026-08-10T10:00:00.000Z'), mensaje('m2', '2026-08-10T11:00:00.000Z')],
      true,
    );

    expect(nextMessagesCursor(page)).toBe('2026-08-10T10:00:00.000Z');
  });

  it('sin más mensajes atrás, no hay cursor siguiente', () => {
    const page = pagina([mensaje('m1', '2026-08-10T10:00:00.000Z')], false);

    expect(nextMessagesCursor(page)).toBeUndefined();
  });

  it('una página vacía tampoco pide otra', () => {
    expect(nextMessagesCursor(pagina([], true))).toBeUndefined();
  });
});
