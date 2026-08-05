import { z } from 'zod';

import { accentSchema } from './congregations';

/**
 * Para qué está disponible una persona: su **labor** —así se llama en la
 * interfaz—.
 *
 * Lo que se guarda en el creyente es el `slug`, y por eso el calendario sigue
 * casando personas con reuniones sin saber nada del catálogo: un calendario de
 * púlpito busca a quien tenga `pulpito`. No son *permisos*: quien predica puede
 * no tener ni cuenta (RFC 0002 D8).
 *
 * Lo que **sí** cambió: el catálogo eran los **roles**, porque las labores de
 * una iglesia y sus accesos parecían la misma lista. No lo son: «ofrenda» o
 * «profecía por primera vez» son labores de verdad y no roles de nadie, y así
 * no cabían. Ahora hay un catálogo propio por iglesia, como el de dones, y las
 * cuatro que además son roles conservan su slug para no romper el calendario.
 */
export const MINISTRIES = ['pulpito', 'recepcion', 'sonido', 'biblias'] as const;

/** Las que trae cada iglesia de serie; el catálogo puede tener más. */
export type Ministry = string;

export const ministrySchema = z.string().trim().min(2).max(40);

export const PULPIT_MINISTRY: Ministry = 'pulpito';

/** Si ese texto tiene forma de labor: un slug. */
export function isMinistry(value: string): value is Ministry {
  return /^[a-z0-9-]{2,40}$/.test(value);
}

/**
 * Las siete labores que trae cada iglesia de serie.
 *
 * Las cuatro primeras comparten slug con su rol —biblias, sonido, púlpito y
 * recepción—, que es lo que hace que el calendario las siga reconociendo. Las
 * tres últimas no son roles de nadie, y por eso no cabían antes.
 *
 * El nombre **no se traduce**: es dato de la iglesia, igual que el de un don o
 * el de una sede. Lo que sí va en los seis idiomas es todo lo que lo rodea.
 */
export const SYSTEM_MINISTRIES = [
  { slug: 'biblias', name: 'Biblias' },
  { slug: 'sonido', name: 'Sonido' },
  { slug: 'pulpito', name: 'Púlpito' },
  { slug: 'recepcion', name: 'Recepción' },
  { slug: 'ofrenda', name: 'Ofrenda' },
  { slug: 'profecia-ensenanzas', name: 'Profecía en enseñanzas' },
  { slug: 'profecia-primera-vez', name: 'Profecía por primera vez' },
] as const;

/**
 * Una labor del catálogo de la iglesia. Misma forma que un don —nombre, color y
 * orden— más el `slug`, que es lo que se guarda en la persona.
 */
export const ministryCatalogSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  slug: z.string(),
  name: z.string(),
  /** Token de la paleta o `#rrggbb`, como las sedes. */
  accent: z.string(),
  position: z.number().int(),
  /** De serie: se renombra y se desactiva, no se borra. */
  isSystem: z.boolean(),
  /** Apagada deja de proponerse, sin perder el historial de quien la tiene. */
  isActive: z.boolean(),
});

export type MinistryCatalog = z.infer<typeof ministryCatalogSchema>;

export const createMinistrySchema = z.object({
  name: z.string().trim().min(2, 'El nombre de la labor es obligatorio').max(60),
  accent: accentSchema.optional(),
});

export type CreateMinistryInput = z.infer<typeof createMinistrySchema>;

export const updateMinistrySchema = createMinistrySchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type UpdateMinistryInput = z.infer<typeof updateMinistrySchema>;

/**
 * El slug de una labor nueva, a partir de su nombre: «Profecía en enseñanzas»
 * → `profecia-ensenanzas`.
 *
 * Se genera y no lo escribe nadie: es un identificador, no un dato que se
 * edite. Si dos nombres distintos dieran el mismo, el servicio le pone sufijo.
 */
export function toMinistrySlug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
