import { z } from 'zod';

import { MESSAGES_PAGE_SIZE } from '../constants';
import { messageAttachmentSchema } from './chat-attachments';

/**
 * Varias reacciones por persona, una por emoji (D7):
 * `UNIQUE(messageId, userId, emoji)` en la base, y aquí simplemente se lista.
 */
export const messageReactionSchema = z.object({
  emoji: z.string(),
  userId: z.string(),
});

export type MessageReaction = z.infer<typeof messageReactionSchema>;

/** Un mensaje citado (`replyTo`) o reenviado (`forwardedFrom`), recortado. */
export const messageSummarySchema = z.object({
  id: z.uuid(),
  authorId: z.string(),
  authorName: z.string(),
  body: z.string().nullable(),
  deletedAt: z.string().nullable(),
});

export type MessageSummary = z.infer<typeof messageSummarySchema>;

export const messageSchema = z.object({
  id: z.uuid(),
  channelId: z.uuid(),
  authorId: z.string(),
  authorName: z.string(),
  authorImage: z.string().nullable(),
  /** `null` si el mensaje es solo adjunto. */
  body: z.string().nullable(),
  replyTo: messageSummarySchema.nullable(),
  /** Presente si este mensaje es el resultado de reenviar otro (D4). */
  forwardedFrom: messageSummarySchema.nullable(),
  attachments: z.array(messageAttachmentSchema),
  reactions: z.array(messageReactionSchema),
  editedAt: z.string().nullable(),
  deletedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type Message = z.infer<typeof messageSchema>;

/** Una página del historial, paginada por cursor (`before`), no por `page` (§3). */
export const messagesPageSchema = z.object({
  items: z.array(messageSchema),
  hasMore: z.boolean(),
});

export type MessagesPage = z.infer<typeof messagesPageSchema>;

export const messagesQuerySchema = z.object({
  /** El `createdAt` del mensaje más antiguo ya cargado; sin él, la última página. */
  before: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(MESSAGES_PAGE_SIZE),
});

export type MessagesQuery = z.infer<typeof messagesQuerySchema>;

export const createMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
  replyToId: z.uuid().optional(),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const updateMessageSchema = z.object({
  body: z.string().trim().min(1).max(4000),
});

export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;

/** Reenviar (D4): copia el cuerpo y los adjuntos, no referencia el original. */
export const forwardMessageSchema = z.object({
  channelIds: z.array(z.uuid()).min(1).max(20),
});

export type ForwardMessageInput = z.infer<typeof forwardMessageSchema>;

export const reactMessageSchema = z.object({
  emoji: z.string().trim().min(1).max(8),
});

export type ReactMessageInput = z.infer<typeof reactMessageSchema>;

/** Lo que llega al subir un adjunto: la leyenda y, si responde, a qué mensaje. */
export const uploadAttachmentSchema = z.object({
  body: z.string().trim().max(4000).optional(),
  replyToId: z.uuid().optional(),
});

export type UploadAttachmentInput = z.infer<typeof uploadAttachmentSchema>;
