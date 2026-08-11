import { z } from 'zod';

/**
 * Un audio adjunto a una entrada del cuaderno: grabado ahí mismo o adjuntado
 * ya hecho.
 *
 * Gemelo exacto de `noteAudioSchema` (RFC 0017 D7): los tipos aceptados, el
 * tope de tamaño y las extensiones son los mismos y se importan de
 * `note-audio.ts` sin duplicarlos (`AUDIO_MIME_TYPES`, `MAX_AUDIO_BYTES`,
 * `AUDIO_EXTENSIONS`, `isAudioMimeType`). Lo único que cambia es de qué cuelga.
 */
export const journalEntryAudioSchema = z.object({
  id: z.uuid(),
  entryId: z.uuid(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  /** Lo que dura, si el navegador lo supo medir al grabarlo. */
  durationSeconds: z.number().int().nullable(),
  /** Si se grabó ahí mismo o se adjuntó ya hecho. Se dice en la interfaz. */
  recorded: z.boolean(),
  createdAt: z.string(),
});

export type JournalEntryAudio = z.infer<typeof journalEntryAudioSchema>;

/**
 * De dónde lo descarga la interfaz. **Bajo `/journal/audios/:id` y no bajo
 * `/audios/:id`**: esa raíz ya está tomada por las notas de creyentes (RFC
 * 0003), y reutilizarla sin querer serviría un audio con el guard equivocado.
 */
export function journalAudioPath(audioId: string): string {
  return `/journal/audios/${audioId}`;
}
