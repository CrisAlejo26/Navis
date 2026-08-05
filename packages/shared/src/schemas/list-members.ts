import { z } from 'zod';

/**
 * Un **miembro**: un creyente dentro de una lista, en una posición (RFC 0010
 * §6.2).
 *
 * Lleva lo que hace falta para pintar la fila —nombre, sede, labores, foto— sin
 * volver a pedir la ficha entera de cada persona. `hasAccess` es la llave
 * pequeña que se ve al lado del nombre: es la forma de leer de un vistazo la
 * distinción de D21 —estar en una lista no es poder verla— sin cambiar de
 * pestaña.
 */
export const listMemberSchema = z.object({
  believerId: z.uuid(),
  firstName: z.string(),
  lastName: z.string(),
  position: z.number().int(),
  note: z.string().nullable(),
  congregationId: z.uuid().nullable(),
  congregationName: z.string().nullable(),
  congregationAccent: z.string().nullable(),
  ministries: z.array(z.string()),
  hasPhoto: z.boolean(),
  /** Si esa persona tiene además un acceso que abre **esta** lista (D21). */
  hasAccess: z.boolean(),
});

export type ListMember = z.infer<typeof listMemberSchema>;

/** La ficha: la lista con sus miembros ya ordenados por `position` (D6). */
export const listDetailSchema = z.object({
  members: z.array(listMemberSchema),
});

export const addListMembersSchema = z.object({
  believerIds: z.array(z.uuid()).min(1, 'Marca al menos a una persona').max(500),
});

export type AddListMembersInput = z.infer<typeof addListMembersSchema>;

export const updateListMemberSchema = z.object({
  note: z.string().trim().max(120).nullable(),
});

export type UpdateListMemberInput = z.infer<typeof updateListMemberSchema>;

/**
 * El orden **entero**, no «sube uno» (§7.1). Movimientos relativos lanzados
 * desde dos pantallas a la vez acaban en un orden que no es el de nadie.
 */
export const reorderListSchema = z.object({
  believerIds: z.array(z.uuid()).max(500),
});

export type ReorderListInput = z.infer<typeof reorderListSchema>;

/**
 * En qué listas está cada persona: `{ believerId: [listId] }` (§8.7).
 *
 * Una sola llamada por iglesia que se cachea, y **no** un `join` dentro del
 * listado paginado: con relaciones cargadas, `take`/`skip` de TypeORM se van a
 * una subconsulta con `DISTINCT` y Postgres exige entonces que todo lo que se
 * ordena esté en la lista de selección (CLAUDE.md).
 */
export type ListMemberships = Record<string, string[]>;
