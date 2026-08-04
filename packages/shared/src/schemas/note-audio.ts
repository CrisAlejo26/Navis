import { z } from 'zod';

/**
 * Lo que se acepta como audio de una nota.
 *
 * `audio/webm` es lo que graba Chrome y Firefox; `audio/mp4` lo que graba
 * Safari. Los demás son para lo que se adjunta ya grabado —una nota de voz de
 * WhatsApp llega como `audio/ogg`—.
 */
export const AUDIO_MIME_TYPES = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/x-m4a',
] as const;

export type AudioMimeType = (typeof AUDIO_MIME_TYPES)[number];

export function isAudioMimeType(value: string): value is AudioMimeType {
  // El navegador añade el códec al tipo: `audio/webm;codecs=opus`.
  const base = value.split(';')[0]?.trim().toLowerCase() ?? '';
  return (AUDIO_MIME_TYPES as readonly string[]).includes(base);
}

/**
 * Tope de un audio, en bytes.
 *
 * Veinticinco megas son cerca de media hora de voz en opus. Más que eso no es
 * una nota de voz: es una grabación de un culto, y eso no cabe en una ficha
 * pastoral ni en las copias de seguridad de nadie.
 */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

/** La extensión con la que se guarda cada tipo. Nunca la que diga el cliente. */
export const AUDIO_EXTENSIONS: Record<AudioMimeType, string> = {
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/x-m4a': 'm4a',
};

/** Un audio adjunto a una nota. El fichero vive en disco; esto es su ficha. */
export const noteAudioSchema = z.object({
  id: z.uuid(),
  noteId: z.uuid(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  /** Lo que dura, si el navegador lo supo medir al grabarlo. */
  durationSeconds: z.number().int().nullable(),
  /** Si se grabó ahí mismo o se adjuntó ya hecho. Se dice en la interfaz. */
  recorded: z.boolean(),
  createdAt: z.string(),
});

export type NoteAudio = z.infer<typeof noteAudioSchema>;

/** De dónde lo descarga la interfaz. Un solo sitio que lo diga (Regla 1). */
export function noteAudioPath(audioId: string): string {
  return `/audios/${audioId}`;
}
