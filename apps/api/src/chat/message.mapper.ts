import type { ChatContact, Message as MessageView, MessageSummary } from '@navis/shared';

import type { Message } from './message.entity';

function contactOf(userId: string, users: Map<string, ChatContact>): ChatContact {
  return users.get(userId) ?? { id: userId, name: '', email: '', image: null };
}

function toSummary(
  message: Message | null,
  users: Map<string, ChatContact>,
): MessageSummary | null {
  if (!message) return null;

  return {
    id: message.id,
    authorId: message.authorId,
    authorName: contactOf(message.authorId, users).name,
    body: message.deletedAt ? null : message.body,
    deletedAt: message.deletedAt?.toISOString() ?? null,
  };
}

/**
 * Un mensaje borrado sigue en el hilo (RFC 0016 §3): se manda con `body` y
 * adjuntos vacíos y `deletedAt` puesto, y la interfaz pinta «Mensaje
 * eliminado» — el borrado no quita la fila, la vacía.
 */
export function toMessageView(message: Message, users: Map<string, ChatContact>): MessageView {
  const author = contactOf(message.authorId, users);
  const deleted = Boolean(message.deletedAt);

  return {
    id: message.id,
    channelId: message.channelId,
    authorId: message.authorId,
    authorName: author.name,
    authorImage: author.image,
    body: deleted ? null : message.body,
    replyTo: toSummary(message.replyTo ?? null, users),
    forwardedFrom: toSummary(message.forwardedFrom ?? null, users),
    attachments: deleted
      ? []
      : (message.attachments ?? []).map((attachment) => ({
          id: attachment.id,
          kind: attachment.kind,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          sizeBytes: attachment.sizeBytes,
        })),
    reactions: (message.reactions ?? []).map((reaction) => ({
      emoji: reaction.emoji,
      userId: reaction.userId,
    })),
    editedAt: message.editedAt?.toISOString() ?? null,
    deletedAt: message.deletedAt?.toISOString() ?? null,
    createdAt: message.createdAt.toISOString(),
  };
}

/** Los identificadores de cuenta que hace falta resolver para pintar estos mensajes. */
export function authorIdsOf(messages: readonly Message[]): string[] {
  return messages.flatMap((message) =>
    [message.authorId, message.replyTo?.authorId, message.forwardedFrom?.authorId].filter(
      (id): id is string => Boolean(id),
    ),
  );
}
