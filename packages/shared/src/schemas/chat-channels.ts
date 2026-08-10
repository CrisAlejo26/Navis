import { z } from 'zod';

import { MAX_GROUP_MEMBERS } from '../constants';

/**
 * Los tres tipos de canal (RFC 0016 D1). Se llaman así y no `directo`/`canal`/
 * `anuncios` como el borrador original: dicen lo que son en el idioma del
 * proyecto, y `canal` sonaba a Slack y confundía con «grupo».
 */
export const CHANNEL_KINDS = ['individual', 'grupo', 'aviso'] as const;

export type ChannelKind = (typeof CHANNEL_KINDS)[number];

export function isChannelKind(value: string): value is ChannelKind {
  return (CHANNEL_KINDS as readonly string[]).includes(value);
}

export const channelKindSchema = z.enum(CHANNEL_KINDS);

export const CHANNEL_MEMBER_ROLES = ['miembro', 'moderador'] as const;

export type ChannelMemberRole = (typeof CHANNEL_MEMBER_ROLES)[number];

export const channelMemberRoleSchema = z.enum(CHANNEL_MEMBER_ROLES);

/** Una cuenta con la que se puede hablar (§2): quien sale en el buscador de contactos. */
export const chatContactSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
});

export type ChatContact = z.infer<typeof chatContactSchema>;

/** Un miembro de un canal, con lo que hace falta para pintar la cabecera y el listado. */
export const channelMemberSchema = z.object({
  userId: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: channelMemberRoleSchema,
  lastReadAt: z.string(),
  mutedUntil: z.string().nullable(),
});

export type ChannelMember = z.infer<typeof channelMemberSchema>;

/** Recorte de un mensaje para la fila de la lista, sin sus adjuntos ni reacciones. */
export const channelLastMessageSchema = z.object({
  id: z.uuid(),
  body: z.string().nullable(),
  authorId: z.string(),
  authorName: z.string(),
  hasAttachment: z.boolean(),
  createdAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type ChannelLastMessage = z.infer<typeof channelLastMessageSchema>;

/** Un canal en el listado: lo que pinta una fila (§5), con el no leídos ya calculado. */
export const channelListItemSchema = z.object({
  id: z.uuid(),
  kind: channelKindSchema,
  /** `null` en «individual»: se pinta con el nombre de la otra persona. */
  name: z.string().nullable(),
  description: z.string().nullable(),
  photoKey: z.string().nullable(),
  /** Archivo GLOBAL (D2): lo puso un moderador y afecta a todo el mundo. */
  isArchived: z.boolean(),
  myRole: channelMemberRoleSchema,
  /** Archivo PERSONAL (D2). `null` si esta cuenta no lo ha archivado. */
  archivedAt: z.string().nullable(),
  mutedUntil: z.string().nullable(),
  unreadCount: z.number().int(),
  memberCount: z.number().int(),
  /** Solo en «individual»: con quién se habla, para el nombre y el avatar. */
  otherMember: chatContactSchema.nullable(),
  lastMessage: channelLastMessageSchema.nullable(),
});

export type ChannelListItem = z.infer<typeof channelListItemSchema>;

/** El canal abierto: la cabecera de la lista, más sus miembros completos. */
export const channelDetailSchema = channelListItemSchema.extend({
  createdBy: z.string(),
  members: z.array(channelMemberSchema),
});

export type ChannelDetail = z.infer<typeof channelDetailSchema>;

/**
 * Crear una conversación (D5: cualquier cuenta con `communications.view`
 * puede crear un grupo). `memberIds` no incluye a quien la crea.
 */
export const createChannelSchema = z
  .object({
    kind: channelKindSchema,
    memberIds: z.array(z.string()).min(1).max(MAX_GROUP_MEMBERS),
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .refine((input) => input.kind !== 'individual' || input.memberIds.length === 1, {
    message: 'Una conversación individual es con una sola persona',
    path: ['memberIds'],
  })
  .refine((input) => input.kind === 'individual' || Boolean(input.name), {
    message: 'Ponle un nombre al grupo',
    path: ['name'],
  });

export type CreateChannelInput = z.infer<typeof createChannelSchema>;

export const updateChannelSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(500).nullable().optional(),
});

export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;

/** `?archived=true` para ver los archivados en vez de la bandeja normal. */
export const channelsQuerySchema = z.object({
  archived: z.coerce.boolean().optional(),
});

export type ChannelsQuery = z.infer<typeof channelsQuerySchema>;

export const contactsQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
});

export type ContactsQuery = z.infer<typeof contactsQuerySchema>;
