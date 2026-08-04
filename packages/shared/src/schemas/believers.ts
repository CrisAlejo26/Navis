import { z } from 'zod';

/**
 * Para qué está disponible una persona.
 *
 * No es un rol de la tabla `roles` —eso son permisos de una cuenta, y quien
 * predica puede no tener cuenta— ni todavía una etiqueta de la RFC 0003:
 * responde a una pregunta operativa, «¿a quién puedo poner en el púlpito?»
 * (RFC 0002 §6.2).
 */
export const MINISTRIES = ['pulpito'] as const;

export type Ministry = (typeof MINISTRIES)[number];

export const PULPIT_MINISTRY: Ministry = 'pulpito';

/**
 * El **núcleo mínimo** de un creyente: lo justo para poder programarle un
 * turno. La ficha completa —notas, familia, etiquetas— llega con la RFC 0003
 * añadiendo columnas, sin rehacer nada de esto.
 */
export const believerSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  /** Su sede habitual. No acota nada: cualquiera puede predicar en cualquiera. */
  congregationId: z.uuid().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  isActive: z.boolean(),
  ministries: z.array(z.string()),
});

export type Believer = z.infer<typeof believerSchema>;

export const createBelieverSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre es obligatorio').max(80),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  congregationId: z.uuid().nullable().optional(),
  ministries: z.array(z.enum(MINISTRIES)).optional(),
});

export type CreateBelieverInput = z.infer<typeof createBelieverSchema>;

export const updateBelieverSchema = createBelieverSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateBelieverInput = z.infer<typeof updateBelieverSchema>;

/** `Juan Carlos` + `Ruiz` → `Juan Carlos Ruiz`, sin espacios de más. */
export function believerName(person: { firstName: string; lastName?: string | null }): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
}
