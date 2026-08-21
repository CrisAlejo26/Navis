import { z } from 'zod';

import { isoDateSchema } from './common';

/**
 * El documento de una enseñanza (RFC 0022 §4.2): una lista blanca cerrada de
 * nodos, no HTML libre. El editor de web solo produce este árbol y el
 * servidor solo acepta este árbol — es la validación **y** el saneado a la
 * vez, porque nunca se renderiza nada fuera de esta forma con
 * `dangerouslySetInnerHTML`.
 *
 * Sin recursión de verdad: un párrafo no contiene una lista, así que no hace
 * falta `z.lazy()` en ningún punto de este árbol.
 */
const markSchema = z.object({ type: z.enum(['bold', 'italic']) });

const textNodeSchema = z.object({
  type: z.literal('text'),
  text: z.string(),
  marks: z.array(markSchema).optional(),
});

const paragraphSchema = z.object({
  type: z.literal('paragraph'),
  content: z.array(textNodeSchema).optional(),
});

const listItemSchema = z.object({
  type: z.literal('listItem'),
  content: z.array(paragraphSchema),
});

const taskItemSchema = z.object({
  type: z.literal('taskItem'),
  attrs: z.object({ checked: z.boolean() }),
  content: z.array(paragraphSchema),
});

const bulletListSchema = z.object({
  type: z.literal('bulletList'),
  content: z.array(listItemSchema),
});

const orderedListSchema = z.object({
  type: z.literal('orderedList'),
  content: z.array(listItemSchema),
});

const taskListSchema = z.object({
  type: z.literal('taskList'),
  content: z.array(taskItemSchema),
});

const blockSchema = z.discriminatedUnion('type', [
  paragraphSchema,
  bulletListSchema,
  orderedListSchema,
  taskListSchema,
]);

export const teachingBodySchema = z.object({
  type: z.literal('doc'),
  content: z.array(blockSchema),
});

export type TeachingMark = z.infer<typeof markSchema>;
export type TeachingTextNode = z.infer<typeof textNodeSchema>;
export type TeachingParagraph = z.infer<typeof paragraphSchema>;
export type TeachingListItemNode = z.infer<typeof listItemSchema>;
export type TeachingTaskItem = z.infer<typeof taskItemSchema>;
export type TeachingBlock = z.infer<typeof blockSchema>;
export type TeachingBody = z.infer<typeof teachingBodySchema>;

/** Un documento vacío: un único párrafo sin texto, lo que enseña un editor recién abierto. */
export const EMPTY_TEACHING_BODY: TeachingBody = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

/**
 * Una enseñanza personal, entera (RFC 0022 §4.1).
 *
 * Sin `churchId`: es de quien la escribe y no de una iglesia (RFC 0004 D1),
 * el mismo modelo que las profecías.
 */
export const teachingSchema = z.object({
  id: z.uuid(),
  title: z.string(),
  body: teachingBodySchema,
  receivedAt: isoDateSchema,
  createdAt: z.string(),
});

export type Teaching = z.infer<typeof teachingSchema>;

const titleSchema = z.string().trim().min(1, 'La enseñanza necesita un título').max(200);

export const createTeachingSchema = z.object({
  title: titleSchema,
  body: teachingBodySchema,
  receivedAt: isoDateSchema,
});

export type CreateTeachingInput = z.infer<typeof createTeachingSchema>;

export const updateTeachingSchema = z.object({
  title: titleSchema.optional(),
  body: teachingBodySchema.optional(),
  receivedAt: isoDateSchema.optional(),
});

export type UpdateTeachingInput = z.infer<typeof updateTeachingSchema>;
