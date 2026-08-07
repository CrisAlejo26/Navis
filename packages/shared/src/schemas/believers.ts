import { z } from 'zod';

import { emailSchema } from './auth';
import { isoDateSchema } from './common';
import { ministrySchema } from './ministries';

/**
 * Dónde está hoy esa persona (RFC 0003 D2).
 *
 * Sustituye al viejo `is_active`: tener un booleano **y** un estado sería tener
 * dos fuentes de verdad que se desincronizan a la primera. `nuevo` no es
 * decoración: quien acaba de llegar es justo a quien más caro sale perder de
 * vista.
 */
export const BELIEVER_STATUSES = ['activo', 'nuevo', 'inactivo', 'trasladado'] as const;

export type BelieverStatus = (typeof BELIEVER_STATUSES)[number];

export const DEFAULT_BELIEVER_STATUS: BelieverStatus = 'activo';

/** A quién se le puede programar un turno: los que siguen viniendo (D2). */
export const SCHEDULABLE_STATUSES = ['activo', 'nuevo'] as const;

/** Los días de margen de serie. Sin él, cualquiera se pierde de vista (D3). */
export const DEFAULT_ALERT_AFTER_DAYS = 30;

/** Tope del margen: cinco años sin escribir nada ya no es un aviso, es un archivo. */
export const MAX_ALERT_AFTER_DAYS = 1825;

export function isBelieverStatus(value: string): value is BelieverStatus {
  return (BELIEVER_STATUSES as readonly string[]).includes(value);
}

export function isSchedulable(status: BelieverStatus): boolean {
  return (SCHEDULABLE_STATUSES as readonly string[]).includes(status);
}

export const believerStatusSchema = z.enum(BELIEVER_STATUSES);

/** El aviso: días de margen, o `null` para apagarlo. Un solo significado (D3). */
export const alertAfterDaysSchema = z.number().int().min(1).max(MAX_ALERT_AFTER_DAYS).nullable();

/**
 * **Cuándo** empezó cada labor y **cuándo** se recibió cada don (RFC 0012).
 *
 * Un mapa aparte, y no un objeto por labor, a propósito: `ministries` y
 * `giftIds` siguen respondiendo **qué** tiene esa persona, que es lo que
 * consultan el calendario, las listas y la tabla del listado. Meterles la fecha
 * dentro obligaría a tocar quince sitios para que la ficha enseñe un dato que
 * solo se mira en la ficha.
 *
 * Lo que no está en el mapa no tiene fecha, y eso es lo normal: casi todo el
 * mundo sabe qué hace y no cuándo empezó.
 */
export const dateByKeySchema = z.record(z.string(), isoDateSchema.nullable());

export type DateByKey = z.infer<typeof dateByKeySchema>;

/** Tope de las tres cuentas: leerse la Biblia mil veces no es un dato, es un dedo. */
export const MAX_READ_COUNT = 500;

export const readCountSchema = z.number().int().min(0).max(MAX_READ_COUNT).nullable();

/**
 * Una persona de la iglesia, con su ficha completa (RFC 0003 §5.1). Continúa
 * la tabla del núcleo mínimo de la RFC 0002 §6; no crea otra (D1).
 */
export const believerSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  /** Su sede habitual. No acota nada: cualquiera puede predicar en cualquiera. */
  congregationId: z.uuid().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable(),
  email: z.string().nullable(),
  status: believerStatusSchema,
  /** Días que pueden pasar sin nota antes de que salte el aviso. `null` lo apaga. */
  alertAfterDays: z.number().int().nullable(),
  /** Derivado de la última nota; lo escribe solo `NotesService` (D4). */
  lastNoteAt: isoDateSchema.nullable(),
  /** Instante del alta: sin ninguna nota, el margen se cuenta desde aquí (§5.4). */
  createdAt: z.string(),
  ministries: z.array(z.string()),

  /*
   * La trayectoria en la iglesia (RFC 0012). Todo opcional: son datos que se
   * van completando con los años, y una ficha a medias es lo normal, no un
   * error.
   */

  /** Mes y año en que llegó. Se guarda el día 1: el mes es lo que se sabe. */
  arrivedAt: isoDateSchema.nullable(),
  /** La sede donde llegó, escrita como la escribió: «Iglesia la 40 Tuluá». */
  arrivalSite: z.string().nullable(),
  /** Cuántas veces ha leído la Biblia entera. */
  bibleReadings: z.number().int().nullable(),
  /** Cuántas veces ha leído el libro de vivencias. */
  vivenciasReadings: z.number().int().nullable(),
  /** En cuántos institutos bíblicos ha participado. */
  bibleInstituteTimes: z.number().int().nullable(),

  /** Cuándo empezó cada labor, por `slug`. Lo que no está, no tiene fecha. */
  ministryDates: dateByKeySchema,
  /** Cuándo recibió cada don, por identificador del catálogo. */
  giftDates: dateByKeySchema,
  /**
   * Si tiene fotografía. **Un booleano y no la imagen ni su ruta**: el fichero
   * se pide aparte a `believerPhotoPath(id)`, que va con la cookie de sesión, y
   * así una lista de veinte personas no arrastra veinte imágenes en el JSON.
   */
  hasPhoto: z.boolean(),
});

export type Believer = z.infer<typeof believerSchema>;

export const createBelieverSchema = z.object({
  firstName: z.string().trim().min(2, 'El nombre es obligatorio').max(80),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  /** Se reutiliza `emailSchema` (normaliza a minúsculas y valida el formato),
   *  pero aquí es opcional y nulable: no todo el mundo lo ha anotado. */
  email: emailSchema.nullable().optional(),
  congregationId: z.uuid().nullable().optional(),
  status: believerStatusSchema.optional(),
  alertAfterDays: alertAfterDaysSchema.optional(),
  ministries: z.array(ministrySchema).optional(),
  /** Los dones que ya se le conocen, por identificador del catálogo (D5). */
  giftIds: z.array(z.uuid()).optional(),

  arrivedAt: isoDateSchema.nullable().optional(),
  arrivalSite: z.string().trim().max(120).nullable().optional(),
  bibleReadings: readCountSchema.optional(),
  vivenciasReadings: readCountSchema.optional(),
  bibleInstituteTimes: readCountSchema.optional(),

  /**
   * Las fechas viajan **con** su lista, en la misma petición: una clave que no
   * esté en `ministries` o en `giftIds` se ignora, así que no puede quedar la
   * fecha de una labor que ya no tiene.
   */
  ministryDates: dateByKeySchema.optional(),
  giftDates: dateByKeySchema.optional(),
});

export type CreateBelieverInput = z.infer<typeof createBelieverSchema>;

export const updateBelieverSchema = createBelieverSchema.partial();

export type UpdateBelieverInput = z.infer<typeof updateBelieverSchema>;

/** `Juan Carlos` + `Ruiz` → `Juan Carlos Ruiz`, sin espacios de más. */
export function believerName(person: { firstName: string; lastName?: string | null }): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ').trim();
}

/**
 * El nombre tal y como se guarda en `search_name` para buscarlo: en minúsculas
 * y sin acentos (D14).
 *
 * Así «jesus» encuentra «Jesús» **igual en Postgres y en SQLite**, con un
 * `LIKE` sobre una columna indexada y sin depender de `unaccent` ni de
 * `pg_trgm`, que en SQLite no existen. La misma función normaliza lo que se
 * guarda y lo que se busca: si divergieran, la búsqueda dejaría de encontrar.
 */
export function toSearchName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // los diacríticos que NFD ha separado
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}
