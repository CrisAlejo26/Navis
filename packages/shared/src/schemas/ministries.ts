import { z } from 'zod';

/**
 * Para qué está disponible una persona: su **labor** —así se llama en la
 * interfaz—.
 *
 * El valor es el `slug` de un rol del catálogo, porque las labores de una
 * iglesia y sus roles son la misma lista (púlpito, recepción, sonido,
 * biblias…) y mantenerla dos veces solo sirve para que se desincronicen. No
 * son *permisos*: quien predica puede no tener ni cuenta (RFC 0002 D8).
 *
 * Se valida como texto y no contra la tabla: una labor que ya no exista deja
 * de proponer a nadie, que es exactamente lo que tiene que pasar.
 */
export const MINISTRIES = ['pulpito', 'recepcion', 'sonido', 'biblias'] as const;

/** Las que trae la instalación de serie; el catálogo puede tener más. */
export type Ministry = string;

export const ministrySchema = z.string().trim().min(2).max(40);

export const PULPIT_MINISTRY: Ministry = 'pulpito';

/** Si ese texto tiene forma de labor: el slug de un rol. */
export function isMinistry(value: string): value is Ministry {
  return /^[a-z0-9-]{2,40}$/.test(value);
}
