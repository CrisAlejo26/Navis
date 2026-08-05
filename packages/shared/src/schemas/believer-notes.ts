import { z } from 'zod';

import { isoDateSchema } from './common';
import { noteAudioSchema } from './note-audio';

/**
 * Los seis tipos de entrada de la bitácora (RFC 0003 D7).
 *
 * Es texto validado contra esta constante, como los ministerios: un tipo que
 * dejara de existir deja de proponerse, no rompe el historial que ya está
 * escrito.
 */
export const NOTE_KINDS = [
  'seguimiento',
  'testimonio',
  'sueno',
  'vision',
  'experiencia',
  'don',
  /**
   * **Corrección**: algo que se hizo mal y hubo que hablar.
   *
   * Se llama así y no «falta» ni «amonestación» a propósito: lo que se anota es
   * la conversación, no el expediente. Va la última de la lista porque es la
   * que menos se escribe, y es la única cuyo color es `destructive` —la
   * distingue de un vistazo en una bitácora de diez años—.
   */
  'correccion',
] as const;

export type NoteKind = (typeof NOTE_KINDS)[number];

export const DEFAULT_NOTE_KIND: NoteKind = 'seguimiento';

export function isNoteKind(value: string): value is NoteKind {
  return (NOTE_KINDS as readonly string[]).includes(value);
}

export const noteKindSchema = z.enum(NOTE_KINDS);

/**
 * Una entrada del historial de un hermano.
 *
 * El cuerpo son **dos campos y no uno** (D15): lo que contó y la indicación que
 * se le dio. Es la forma real de una conversación pastoral, y separarlos
 * permite leer solo una de las dos columnas cuando se repasa el historial.
 */
export const believerNoteSchema = z.object({
  id: z.uuid(),
  churchId: z.uuid(),
  believerId: z.uuid(),
  kind: noteKindSchema,
  /** Cuándo pasó, no cuándo se escribió. Es un día, no un instante (D9). */
  occurredAt: isoDateSchema,
  /** Lo que contó. Es lo único obligatorio de una nota. */
  told: z.string(),
  /** La indicación dada. Puede no haberla: escuchar también es acompañar. */
  advice: z.string().nullable(),
  /** El don que recibió, obligatorio si y solo si `kind` es `don` (D8). */
  giftId: z.uuid().nullable(),
  giftName: z.string().nullable(),
  /** El recordatorio: instante completo, porque lleva hora (D16). */
  remindAt: z.string().nullable(),
  remindText: z.string().nullable(),
  /** Cuándo se dio por atendido. Nulo mientras siga pendiente. */
  remindDoneAt: z.string().nullable(),
  audios: z.array(noteAudioSchema),
  authorId: z.string().nullable(),
  authorName: z.string().nullable(),
  createdAt: z.string(),
});

export type BelieverNote = z.infer<typeof believerNoteSchema>;

/** Instante completo, `AAAA-MM-DDTHH:MM`, tal y como lo da un `datetime-local`. */
export const reminderAtSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'El recordatorio necesita día y hora');

/**
 * `giftId` es obligatorio **si y solo si** el tipo es `don`: anotar que alguien
 * recibió un don y que su ficha lo enseñe son la misma acción, no dos (D8). Y
 * un recordatorio sin fecha no recuerda nada.
 */
export const createNoteSchema = z
  .object({
    kind: noteKindSchema,
    occurredAt: isoDateSchema,
    told: z.string().trim().min(1, 'Escribe lo que te contó').max(8000),
    advice: z.string().trim().max(8000).optional(),
    giftId: z.uuid().optional(),
    remindAt: reminderAtSchema.optional(),
    remindText: z.string().trim().max(500).optional(),
  })
  .refine((note) => note.kind !== 'don' || Boolean(note.giftId), {
    message: 'Elige qué don recibió',
    path: ['giftId'],
  })
  .refine((note) => !note.remindText || Boolean(note.remindAt), {
    message: 'El recordatorio necesita día y hora',
    path: ['remindAt'],
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

/** Sin `refine`: al editar puede llegar solo la fecha, o solo el cuerpo. */
export const updateNoteSchema = z.object({
  kind: noteKindSchema.optional(),
  occurredAt: isoDateSchema.optional(),
  told: z.string().trim().min(1).max(8000).optional(),
  advice: z.string().trim().max(8000).nullable().optional(),
  giftId: z.uuid().nullable().optional(),
  remindAt: reminderAtSchema.nullable().optional(),
  remindText: z.string().trim().max(500).nullable().optional(),
  /** `true` da el recordatorio por atendido; `false` lo vuelve a dejar pendiente. */
  remindDone: z.boolean().optional(),
});

export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

/** Cuántas notas hay de cada tipo: las pastillas de la bitácora (§7.5). */
export type NoteCounts = Record<NoteKind, number> & { total: number };

/** Un día con notas, para la vista de calendario (§7.5). */
export interface NoteDay {
  date: string;
  kinds: NoteKind[];
  total: number;
}

/** Si ese recordatorio ya ha vencido y sigue sin atender. */
export function isReminderDue(note: BelieverNote, now = new Date()): boolean {
  if (!note.remindAt || note.remindDoneAt) return false;
  return new Date(note.remindAt).getTime() <= now.getTime();
}
