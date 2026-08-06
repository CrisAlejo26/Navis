import { z } from 'zod';

import { listPublicFieldsSchema, listVisibilitySchema } from './lists';

/**
 * Publicar (§7.1). Lleva el modo, la caducidad, qué campos salen y si la lista
 * se puede descargar, porque las cuatro cosas se deciden en el mismo gesto y en
 * la misma transacción (D9).
 */
export const shareListSchema = z.object({
  visibility: listVisibilitySchema,
  /** Nulo ⇒ sin caducidad. La del acceso va aparte y manda la primera (D13). */
  expiresAt: z.string().nullable().optional(),
  publicFields: listPublicFieldsSchema.partial().optional(),
  /**
   * Si la página pública ofrece llevarse la lista en PDF o en imagen.
   *
   * Nace **apagado**, como la foto: ver una lista en una página es una cosa y
   * dejar que se guarde y se reenvíe un fichero con los nombres de la
   * congregación es otra, y se decide a conciencia.
   */
  allowDownload: z.boolean().optional(),
});

export type ShareListInput = z.infer<typeof shareListSchema>;

/**
 * Lo que contesta publicar, rotar o cambiar de modo.
 *
 * `tokenRotated` no es un detalle: pasar de abierta a restringida **cambia el
 * enlace obligatoriamente** (D12), porque WhatsApp cachea la tarjeta por URL
 * durante semanas y no hay forma de decirle que la olvide. La interfaz lo avisa
 * antes y lo recuerda después: hay que volver a repartirlo.
 */
export const listShareStateSchema = z.object({
  visibility: listVisibilitySchema,
  shareToken: z.string().nullable(),
  sharedAt: z.string().nullable(),
  shareExpiresAt: z.string().nullable(),
  tokenRotated: z.boolean(),
});

export type ListShareState = z.infer<typeof listShareStateSchema>;

/**
 * La fila que se exporta (RFC 0009 D7, RFC 0010 D41).
 *
 * Una lista declara sus columnas y los cinco formatos salen solos: si esto
 * hubiera necesitado un sexto escritor, el juego de allí estaba mal puesto.
 */
export interface ListExportRow {
  position: number;
  name: string;
  congregation: string | null;
  congregationAccent: string | null;
  ministries: string[];
  note: string | null;
  /** Si esa persona tiene además acceso a esta lista (D21). */
  hasAccess: boolean;
}

/**
 * La hoja de credenciales del alta en lote (D29).
 *
 * Es el **único** sitio de todo el proyecto donde sale una contraseña a un
 * fichero, y es la alternativa a teclear treinta a mano: se manda y se borra.
 */
export interface ListCredentialSheetRow {
  name: string;
  username: string;
  password: string;
}
