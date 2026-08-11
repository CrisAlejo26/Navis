import { z } from 'zod';

import { isoDateSchema, reminderAtSchema } from './common';
import { journalEntryAudioSchema } from './journal-audio';

/**
 * Los siete tipos de entrada del cuaderno (RFC 0017 D2).
 *
 * Es texto validado contra esta constante, como los tipos de nota de creyentes
 * (RFC 0003 D7): un tipo que dejara de proponerse no rompe lo ya escrito. El
 * color de cada uno **no vive aquí**: es presentación, y se declara en
 * `apps/web/src/lib/journal/entry-kind.ts`.
 */
export const ENTRY_KINDS = [
  'observacion',
  'testimonio',
  'sueno',
  'bienHecho',
  'correccion',
  'oracion',
  'decision',
] as const;

export type EntryKind = (typeof ENTRY_KINDS)[number];

export const DEFAULT_ENTRY_KIND: EntryKind = 'observacion';

export function isEntryKind(value: string): value is EntryKind {
  return (ENTRY_KINDS as readonly string[]).includes(value);
}

export const entryKindSchema = z.enum(ENTRY_KINDS);

/**
 * Una entrada del cuaderno de la iglesia (RFC 0017 §5).
 *
 * Es de la iglesia activa y no de quien la escribe (D1): quien tiene
 * `journal.view` ve todas las entradas, igual que con la bitácora de
 * creyentes. `authorId`/`authorName` dan crédito, no restringen la lectura.
 */
export const journalEntrySchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  title: z.string(),
  kind: entryKindSchema,
  /** Cuándo pasó, no cuándo se escribió. Es un día, no un instante (D5). */
  occurredAt: isoDateSchema,
  /** Lo que se observó, contó o decidió. Lo único obligatorio del cuerpo (D4). */
  annotation: z.string(),
  /** La reflexión sobre lo anotado. Puede no haberla (D4). */
  learned: z.string().nullable(),
  /** El recordatorio: instante completo, porque lleva hora (D6). */
  remindAt: z.string().nullable(),
  remindText: z.string().nullable(),
  /** Cuándo se dio por atendido. Nulo mientras siga pendiente. */
  remindDoneAt: z.string().nullable(),
  audios: z.array(journalEntryAudioSchema),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  createdAt: z.string(),
});

export type JournalEntry = z.infer<typeof journalEntrySchema>;

/**
 * `giftId` no existe aquí: es el único punto donde este esquema se aparta del
 * de las notas de creyentes, porque no hay nada equivalente que enlazar (D2,
 * Alcance).
 */
export const createEntrySchema = z
  .object({
    title: z.string().trim().min(1, 'Ponle un título a la entrada').max(200),
    kind: entryKindSchema,
    occurredAt: isoDateSchema,
    annotation: z.string().trim().min(1, 'Escribe la anotación').max(8000),
    learned: z.string().trim().max(8000).optional(),
    remindAt: reminderAtSchema.optional(),
    remindText: z.string().trim().max(500).optional(),
  })
  .refine((entry) => !entry.remindText || Boolean(entry.remindAt), {
    message: 'El recordatorio necesita día y hora',
    path: ['remindAt'],
  });

export type CreateEntryInput = z.infer<typeof createEntrySchema>;

/** Sin `refine`: al editar puede llegar solo la fecha, o solo el cuerpo. */
export const updateEntrySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  kind: entryKindSchema.optional(),
  occurredAt: isoDateSchema.optional(),
  annotation: z.string().trim().min(1).max(8000).optional(),
  learned: z.string().trim().max(8000).nullable().optional(),
  remindAt: reminderAtSchema.nullable().optional(),
  remindText: z.string().trim().max(500).nullable().optional(),
  /** `true` da el recordatorio por atendido; `false` lo vuelve a dejar pendiente. */
  remindDone: z.boolean().optional(),
});

export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

/**
 * Si ese recordatorio ya ha vencido y sigue sin atender.
 *
 * Solo pide las dos columnas que hacen falta —no la entrada entera— porque la
 * fila del listado (`JournalEntryListItem`) ya las trae sin el resto de
 * campos, y es donde más se llama: una vez por fila visible.
 */
export function isEntryReminderDue(
  entry: Pick<JournalEntry, 'remindAt' | 'remindDoneAt'>,
  now = new Date(),
): boolean {
  if (!entry.remindAt || entry.remindDoneAt) return false;
  return new Date(entry.remindAt).getTime() <= now.getTime();
}
