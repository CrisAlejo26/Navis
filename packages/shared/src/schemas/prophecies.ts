import { z } from 'zod';

import { isoDateSchema } from './common';

/** Un cumplimiento parcial: qué parte se cumplió y cuándo (RFC 0004 D4). */
export const prophecyFulfillmentSchema = z.object({
  id: z.uuid(),
  prophecyId: z.uuid(),
  /** Qué parte se ha cumplido. Texto plano: el editor no lleva Markdown. */
  text: z.string(),
  occurredAt: isoDateSchema,
  createdAt: z.string(),
});

export type ProphecyFulfillment = z.infer<typeof prophecyFulfillmentSchema>;

/**
 * Una palabra recibida (RFC 0004 §5.1).
 *
 * No lleva `churchId`: una profecía es de un usuario y no de una iglesia (D1).
 * Es el único módulo del proyecto así, y es a propósito.
 */
export const prophecySchema = z.object({
  id: z.uuid(),
  title: z.string(),
  body: z.string(),
  receivedAt: isoDateSchema,
  /** El día en que se acabó de cumplir. `null` mientras siga abierta (D3). */
  fulfilledAt: isoDateSchema.nullable(),
  /** Derivado del último cumplimiento parcial; se escribe en un solo sitio (D4). */
  lastFulfillmentAt: isoDateSchema.nullable(),
  fulfillments: z.array(prophecyFulfillmentSchema),
  createdAt: z.string(),
});

export type Prophecy = z.infer<typeof prophecySchema>;

const titleSchema = z.string().trim().min(1, 'La profecía necesita un título').max(200);
const bodySchema = z.string().trim().min(1, 'Escribe la palabra que recibiste').max(20000);

/**
 * Al crear, la fecha de cumplimiento es opcional; si llega, no puede ser
 * anterior a la de recepción (D7). Hacia el futuro sí se acepta: alguien puede
 * estar apuntando algo con la fecha del día que viene y no es asunto nuestro.
 */
export const createProphecySchema = z
  .object({
    title: titleSchema,
    body: bodySchema,
    receivedAt: isoDateSchema,
    fulfilledAt: isoDateSchema.optional(),
  })
  .refine((one) => !one.fulfilledAt || one.fulfilledAt >= one.receivedAt, {
    message: 'No puede haberse cumplido antes de recibirse',
    path: ['fulfilledAt'],
  });

export type CreateProphecyInput = z.infer<typeof createProphecySchema>;

/**
 * Sin `refine`: al editar puede llegar solo la fecha, o solo el cuerpo, y no
 * hay con qué comparar. La comprobación de D7 la repite el servicio, que sí
 * tiene delante la fila entera.
 */
export const updateProphecySchema = z.object({
  title: titleSchema.optional(),
  body: bodySchema.optional(),
  receivedAt: isoDateSchema.optional(),
  /** `null` la vuelve a abrir y la devuelve a su estado anterior (D6). */
  fulfilledAt: isoDateSchema.nullable().optional(),
});

export type UpdateProphecyInput = z.infer<typeof updateProphecySchema>;

export const createFulfillmentSchema = z.object({
  text: z.string().trim().min(1, 'Escribe qué parte se ha cumplido').max(4000),
  occurredAt: isoDateSchema,
});

export type CreateFulfillmentInput = z.infer<typeof createFulfillmentSchema>;

export const updateFulfillmentSchema = createFulfillmentSchema.partial();

export type UpdateFulfillmentInput = z.infer<typeof updateFulfillmentSchema>;
