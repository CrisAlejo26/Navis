import { z } from 'zod';

/**
 * Lo que se acepta como archivo (no imagen) en un mensaje.
 *
 * La pregunta abierta del RFC 0016 §13 se resolvió a favor de admitir
 * cualquier documento que la otra persona pueda ver y descargar, no solo
 * ofimática: se amplía la lista propuesta (PDF/Word/Excel/PowerPoint/ZIP) con
 * texto plano, CSV, JSON y RTF. Lo que **no** entra son tipos ejecutables o de
 * script (`.exe`, `.sh`, `.bat`…): un chat no es el sitio para eso, y sigue
 * siendo una lista blanca, nunca "lo que no esté en una lista negra".
 */
export const FILE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'application/json',
  'application/rtf',
  'application/zip',
  'application/x-zip-compressed',
] as const;

export type FileMimeType = (typeof FILE_MIME_TYPES)[number];

export function isFileMimeType(value: string): value is FileMimeType {
  const base = value.split(';')[0]?.trim().toLowerCase() ?? '';
  return (FILE_MIME_TYPES as readonly string[]).includes(base);
}

/**
 * Tope de un archivo, en bytes.
 *
 * Veinticinco megas, como un audio: más que una imagen porque un documento
 * pesa más, menos que un vídeo porque esto no es para vídeo (RFC 0016 §7).
 */
export const MAX_FILE_BYTES = 25 * 1024 * 1024;

/** La extensión con la que se guarda cada tipo. Nunca la que diga el cliente. */
export const FILE_EXTENSIONS: Record<FileMimeType, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'application/json': 'json',
  'application/rtf': 'rtf',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
};

/** De dónde lo descarga la interfaz. Un solo sitio que lo diga (Regla 1). */
export function attachmentPath(attachmentId: string): string {
  return `/attachments/${attachmentId}`;
}

export const MESSAGE_ATTACHMENT_KINDS = ['imagen', 'archivo'] as const;

export type MessageAttachmentKind = (typeof MESSAGE_ATTACHMENT_KINDS)[number];

export function isMessageAttachmentKind(value: string): value is MessageAttachmentKind {
  return (MESSAGE_ATTACHMENT_KINDS as readonly string[]).includes(value);
}

/** Un adjunto de mensaje, tal y como lo pinta la interfaz. El fichero vive en disco. */
export const messageAttachmentSchema = z.object({
  id: z.uuid(),
  kind: z.enum(MESSAGE_ATTACHMENT_KINDS),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int(),
});

export type MessageAttachment = z.infer<typeof messageAttachmentSchema>;
