import { z } from 'zod';

import { listPasswordSchema } from './list-password';

/** Minúsculas, cifras, punto, guion y guion bajo. Lo que se teclea en un móvil. */
export const LIST_USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,39}$/;

export const listUsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(LIST_USERNAME_PATTERN, 'El usuario va en minúsculas, de 3 a 40 caracteres');

/**
 * Un **acceso**: un usuario y una contraseña de la iglesia (RFC 0010 D19, D22).
 *
 * **No es una cuenta**: no entra en `user`, no es Better Auth, no tiene rol ni
 * perfil ni correo, y lo único que puede hacer en todo el sistema es leer las
 * listas que se le hayan concedido.
 *
 * **Sin contraseña ni hash, nunca** (§7.2): la contraseña en claro sale
 * exactamente en tres respuestas —crear, regenerar y el lote— y en ninguna más.
 */
export const listViewerSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  /** El creyente al que pertenece, si lo hay. Nulo es un acceso de grupo (D20). */
  believerId: z.uuid().nullable(),
  believerName: z.string().nullable(),
  believerHasPhoto: z.boolean(),
  username: z.string(),
  /** «Ancianos» o el nombre del creyente: para reconocerlo en el directorio. */
  label: z.string(),
  isActive: z.boolean(),
  expiresAt: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string(),
  /** Las listas que abre, por identificador. Es lo que dibujan las pastillas. */
  listIds: z.array(z.uuid()),
});

export type ListViewer = z.infer<typeof listViewerSchema>;

/** Lo único que devuelve la contraseña en claro, y solo al crearla o tirarla. */
export const listCredentialSchema = z.object({
  viewer: listViewerSchema,
  password: z.string(),
});

export type ListCredential = z.infer<typeof listCredentialSchema>;

export const createListViewerSchema = z.object({
  label: z.string().trim().min(2, 'El acceso necesita un nombre para reconocerlo').max(80),
  username: listUsernameSchema,
  password: listPasswordSchema,
  believerId: z.uuid().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  /** A qué listas llega, marcadas de una vez en el mismo diálogo (D19). */
  listIds: z.array(z.uuid()).max(200).optional(),
});

export type CreateListViewerInput = z.infer<typeof createListViewerSchema>;

export const updateListViewerSchema = z.object({
  label: z.string().trim().min(2).max(80).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().nullable().optional(),
  believerId: z.uuid().nullable().optional(),
});

export type UpdateListViewerInput = z.infer<typeof updateListViewerSchema>;

/** Las concesiones, escritas de una vez desde cualquiera de los dos lados. */
export const setListGrantsSchema = z.object({
  ids: z.array(z.uuid()).max(500),
});

export type SetListGrantsInput = z.infer<typeof setListGrantsSchema>;

/**
 * El usuario que se propone a partir de un nombre: `Juan Pérez` → `juan.perez`.
 *
 * Vive aquí porque lo usan **los dos lados**: el diálogo lo propone al elegir a
 * la persona y el alta en lote lo genera en el servidor (D20, D29). El sufijo
 * que evita el choque lo pone el directorio, que es quien sabe qué hay.
 */
export function proposeListUsername(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '')
    .slice(0, 36);

  // Tres caracteres es el mínimo del contrato: un nombre de dos letras acaba
  // siendo `ab.acceso` antes que un usuario que el esquema rechazaría.
  return base.length >= 3 ? base : `${base || 'acceso'}.acceso`;
}

/** Cómo acabó un intento de entrar (§6.6). */
export const LIST_ACCESS_OUTCOMES = ['ok', 'bad_credentials', 'no_grant', 'throttled'] as const;

export type ListAccessOutcome = (typeof LIST_ACCESS_OUTCOMES)[number];

export const listAccessEntrySchema = z.object({
  username: z.string(),
  outcome: z.enum(LIST_ACCESS_OUTCOMES),
  at: z.string(),
  ipPrefix: z.string(),
});

export type ListAccessEntry = z.infer<typeof listAccessEntrySchema>;
