import { z } from 'zod';

/**
 * Para qué está disponible una persona: su **labor** —así se llama en la
 * interfaz—.
 *
 * El valor es el `slug` de un rol del catálogo, porque las labores de una
 * iglesia y sus roles son la misma lista (púlpito, recepción, sonido,
 * biblias…) y mantenerla dos veces solo sirve para que se desincronicen. No
 * son *permisos*: quien predica puede no tener ni cuenta (D8).
 *
 * Se valida como texto y no contra la tabla: una labor que ya no exista deja
 * de proponer a nadie, que es exactamente lo que tiene que pasar.
 */
export const MINISTRIES = ['pulpito', 'recepcion', 'sonido', 'biblias'] as const;

/** Las que trae la instalación de serie; el catálogo puede tener más. */
export type Ministry = string;

export const ministrySchema = z.string().trim().min(2).max(40);

export const PULPIT_MINISTRY: Ministry = 'pulpito';

/**
 * Si ese texto es uno de los ministerios que existen.
 *
 * El ministerio de un calendario viaja como texto —la tabla la puede tocar una
 * migración futura—, así que se comprueba antes de usarlo como tal (Regla 10).
 */
/** Si ese texto tiene forma de labor: el slug de un rol. */
export function isMinistry(value: string): value is Ministry {
  return /^[a-z0-9-]{2,40}$/.test(value);
}

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
  ministries: z.array(ministrySchema).optional(),
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
