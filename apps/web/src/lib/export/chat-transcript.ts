import { messagesPath, nextMessagesCursor, type ApiClient } from '@navis/api-client';
import type { Message, MessagesPage } from '@navis/shared';

import { toPlainDateTime } from './plain-date-time';

/** Los textos, ya traducidos: función pura, no sabe de i18next (RFC 0019 §4). */
export interface ChatTranscriptLabels {
  deletedMessage: string;
  forwarded: string;
  attachmentLine: (name: string) => string;
}

/**
 * El historial completo de un canal, en el mismo orden que `MessageList`
 * (RFC 0016): cada página trae sus mensajes de más viejo a más nuevo, y las
 * páginas se piden de la más reciente hacia atrás — así que, para leerlo en
 * orden, se recorren en el sentido contrario al que se pidieron.
 */
async function fetchAllMessages(api: ApiClient, channelId: string): Promise<Message[]> {
  const pages: MessagesPage[] = [];
  let cursor: string | undefined;

  for (;;) {
    const page = await api.get<MessagesPage>(messagesPath(channelId, cursor));
    pages.push(page);
    cursor = nextMessagesCursor(page);
    if (!cursor) break;
  }

  return [...pages].reverse().flatMap((page) => page.items);
}

function messageLines(message: Message, labels: ChatTranscriptLabels): string {
  const time = toPlainDateTime(message.createdAt);
  const forwardedTag = !message.deletedAt && message.forwardedFrom ? `(${labels.forwarded}) ` : '';
  const body = message.deletedAt ? labels.deletedMessage : `${forwardedTag}${message.body ?? ''}`;

  const attachments = message.deletedAt
    ? []
    : message.attachments.map((attachment) => labels.attachmentLine(attachment.originalName));

  return [`[${time}] ${message.authorName}: ${body}`.trimEnd(), ...attachments].join('\n');
}

/** El texto llano de una conversación entera: mismo formato que exporta el propio WhatsApp. */
export function buildTranscript(
  messages: readonly Message[],
  labels: ChatTranscriptLabels,
): string {
  return messages.map((message) => messageLines(message, labels)).join('\n');
}

export async function fetchChatTranscript(
  api: ApiClient,
  channelId: string,
  labels: ChatTranscriptLabels,
): Promise<string> {
  const messages = await fetchAllMessages(api, channelId);
  return buildTranscript(messages, labels);
}
