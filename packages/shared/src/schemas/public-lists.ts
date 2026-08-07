import { z } from 'zod';

import { listPasswordSchema } from './list-password';
import type { ListMember } from './list-members';
import { listUsernameSchema } from './list-viewers';
import type { ListPublicFields } from './lists';

/**
 * **La forma de lo que sale a la calle**, escrita aparte a propósito (RFC 0010
 * D16, §6.7).
 *
 * El mapeador público construye esto **campo a campo**. Con una lista negra
 * —«el creyente entero menos el teléfono»—, la columna que alguien añada mañana
 * saldría publicada por omisión, y aquí hay nombres de personas detrás.
 */
export const publicListMemberSchema = z.object({
  position: z.number().int(),
  /** Entero o con inicial, según `publicFields.nameStyle`. */
  name: z.string(),
  note: z.string().nullable(),
  congregation: z.string().nullable(),
  ministry: z.string().nullable(),
  /** La trayectoria (RFC 0012): `AAAA-MM-01`, se formatea en el cliente. */
  arrivedAt: z.string().nullable(),
  arrivalSite: z.string().nullable(),
  bibleReadings: z.number().int().nullable(),
  vivenciasReadings: z.number().int().nullable(),
  bibleInstituteTimes: z.number().int().nullable(),
  /**
   * El **único** identificador que sale, y solo con la foto activada: sin él no
   * habría forma de pedir la imagen a `/l/:token/photos/:id` (D17). Con la foto
   * apagada es nulo y en la respuesta no queda ni un identificador.
   */
  photoId: z.uuid().nullable(),
});

export type PublicListMember = z.infer<typeof publicListMemberSchema>;

export const publicListSchema = z.object({
  churchName: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  accent: z.string(),
  /** Cuándo se tocó por última vez: es lo que se lee al pie del cartel. */
  updatedAt: z.string(),
  allowDownload: z.boolean(),
  /** Si hizo falta entrar. Es lo que enseña «Estás viendo como…» y «Salir». */
  restricted: z.boolean(),
  viewerLabel: z.string().nullable(),
  members: z.array(publicListMemberSchema),
});

export type PublicList = z.infer<typeof publicListSchema>;

/**
 * Lo mínimo para pintar **la puerta** (§8.6): la iglesia, el nombre de la lista
 * y su color. Ni el número de personas, ni una sola inicial —el número también
 * es un dato—.
 */
export const publicListGateSchema = z.object({
  churchName: z.string(),
  name: z.string(),
  accent: z.string(),
});

export type PublicListGate = z.infer<typeof publicListGateSchema>;

export const publicListAccessSchema = z.object({
  username: listUsernameSchema,
  password: listPasswordSchema,
});

export type PublicListAccessInput = z.infer<typeof publicListAccessSchema>;

/**
 * Cuántas barras apagadas se pintan en la puerta. **Siempre las mismas**, no
 * las personas que haya: el número también es información (§8.6).
 */
export const LIST_GATE_PLACEHOLDERS = 6;

/** Cuánto dura la cookie de un acceso. Una consulta, no una jornada (D23). */
export const LIST_SESSION_HOURS = 12;

/**
 * **La lista blanca cerrada**: se construye campo a campo, no filtrando el
 * miembro entero (D16).
 *
 * Con una lista negra, la columna que alguien añada mañana saldría publicada por
 * omisión, y aquí hay nombres de personas detrás.
 *
 * Vive en `shared` y no en la API porque la usan **los dos**: el servidor para
 * servir el JSON y el navegador para componer la lámina que se sube como
 * portada (D18). Dos copias de esta función serían dos ideas distintas de qué
 * es público.
 */
export function toPublicListMember(member: ListMember, fields: ListPublicFields): PublicListMember {
  return {
    position: member.position,
    name: publicListName(member, fields.nameStyle),
    note: fields.note ? member.note : null,
    congregation: fields.congregation ? member.congregationName : null,
    ministry: fields.ministry ? (member.ministries[0] ?? null) : null,
    arrivedAt: fields.arrival ? member.arrivedAt : null,
    arrivalSite: fields.arrival ? member.arrivalSite : null,
    bibleReadings: fields.bibleReadings ? member.bibleReadings : null,
    vivenciasReadings: fields.vivenciasReadings ? member.vivenciasReadings : null,
    bibleInstituteTimes: fields.bibleInstituteTimes ? member.bibleInstituteTimes : null,
    /*
     * El único identificador que sale, y solo con la foto activada: sin él no
     * habría forma de pedir la imagen a `/l/:token/photos/:id` (D17). Con la
     * foto apagada es nulo y en la respuesta no queda ni un identificador.
     */
    photoId: fields.photo && member.hasPhoto ? member.believerId : null,
  };
}

/** `Juan Pérez` o `Juan P.`, según lo que se haya elegido al publicar. */
export function publicListName(
  member: { firstName: string; lastName: string },
  style: ListPublicFields['nameStyle'],
): string {
  const apellido = member.lastName.trim();
  if (!apellido) return member.firstName.trim();

  return style === 'initial'
    ? `${member.firstName.trim()} ${apellido.charAt(0).toUpperCase()}.`
    : `${member.firstName.trim()} ${apellido}`;
}
