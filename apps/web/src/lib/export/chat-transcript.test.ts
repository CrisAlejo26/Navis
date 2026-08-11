import type { ApiClient } from '@navis/api-client';
import type { Message, MessagesPage } from '@navis/shared';
import { describe, expect, it } from 'vitest';

import { buildTranscript, fetchChatTranscript, type ChatTranscriptLabels } from './chat-transcript';
import { toPlainDateTime } from './plain-date-time';

const labels: ChatTranscriptLabels = {
  deletedMessage: 'Mensaje eliminado',
  forwarded: 'Reenviado',
  attachmentLine: (name) => `Adjunto: ${name}`,
};

const mensaje = (over: Partial<Message>): Message => ({
  id: 'm1',
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
  createdAt: '2026-08-10T14:00:00.000Z',
  ...over,
});

// La hora se lee en el huso de quien exporta (`toPlainDateTime`, como
// `journal-markdown.test.ts`): se calcula igual que la función bajo prueba,
// no se fija a mano, o el test es frágil según el huso de quien lo corra.
const time = (iso: string) => toPlainDateTime(iso);

describe('buildTranscript', () => {
  it('escribe hora, remitente y cuerpo en una línea', () => {
    const text = buildTranscript([mensaje({ authorName: 'María José', body: 'Hola' })], labels);
    expect(text).toBe(`[${time('2026-08-10T14:00:00.000Z')}] María José: Hola`);
  });

  it('un mensaje eliminado se anuncia como tal, no con su cuerpo original', () => {
    const text = buildTranscript(
      [mensaje({ body: 'esto no debería salir', deletedAt: '2026-08-10T14:05:00.000Z' })],
      labels,
    );
    expect(text).toBe(`[${time('2026-08-10T14:00:00.000Z')}] Juan: Mensaje eliminado`);
  });

  it('un mensaje reenviado lleva la etiqueta delante', () => {
    const text = buildTranscript(
      [
        mensaje({
          body: 'hola',
          forwardedFrom: {
            id: 'm0',
            authorId: 'u2',
            authorName: 'Ana',
            body: 'hola',
            deletedAt: null,
          },
        }),
      ],
      labels,
    );
    expect(text).toBe(`[${time('2026-08-10T14:00:00.000Z')}] Juan: (Reenviado) hola`);
  });

  it('cada adjunto añade su propia línea', () => {
    const text = buildTranscript(
      [
        mensaje({
          body: null,
          attachments: [
            {
              id: 'a1',
              kind: 'imagen',
              originalName: 'foto.jpg',
              mimeType: 'image/jpeg',
              sizeBytes: 10,
            },
          ],
        }),
      ],
      labels,
    );
    expect(text).toBe(`[${time('2026-08-10T14:00:00.000Z')}] Juan:\nAdjunto: foto.jpg`);
  });

  it('varios mensajes salen en líneas separadas, en el orden que llegan', () => {
    const text = buildTranscript(
      [
        mensaje({ id: 'm1', body: 'primero', createdAt: '2026-08-10T14:00:00.000Z' }),
        mensaje({ id: 'm2', body: 'segundo', createdAt: '2026-08-10T14:01:00.000Z' }),
      ],
      labels,
    );
    expect(text.split('\n')).toEqual([
      `[${time('2026-08-10T14:00:00.000Z')}] Juan: primero`,
      `[${time('2026-08-10T14:01:00.000Z')}] Juan: segundo`,
    ]);
  });
});

describe('fetchChatTranscript', () => {
  it('recorre las páginas de más vieja a más nueva, siguiendo el cursor', async () => {
    const newest: MessagesPage = {
      items: [mensaje({ id: 'm3', body: 'c', createdAt: '2026-08-10T14:02:00.000Z' })],
      hasMore: true,
    };
    const oldest: MessagesPage = {
      items: [
        mensaje({ id: 'm1', body: 'a', createdAt: '2026-08-10T14:00:00.000Z' }),
        mensaje({ id: 'm2', body: 'b', createdAt: '2026-08-10T14:01:00.000Z' }),
      ],
      hasMore: false,
    };

    const calls: (string | undefined)[] = [];
    const api = {
      get: (path: string) => {
        const before = new URL(path, 'http://x').searchParams.get('before') ?? undefined;
        calls.push(before);
        return Promise.resolve((before ? oldest : newest) as unknown);
      },
    } as unknown as ApiClient;

    const text = await fetchChatTranscript(api, 'ch1', labels);

    expect(calls).toEqual([undefined, '2026-08-10T14:02:00.000Z']);
    expect(text.split('\n')).toEqual([
      `[${time('2026-08-10T14:00:00.000Z')}] Juan: a`,
      `[${time('2026-08-10T14:01:00.000Z')}] Juan: b`,
      `[${time('2026-08-10T14:02:00.000Z')}] Juan: c`,
    ]);
  });
});
