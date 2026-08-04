import type { BelieverNote as NoteView, NoteAudio as NoteAudioView } from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import type { BelieverNote } from './believer-note.entity';
import type { NoteAudio } from './note-audio.entity';

/**
 * De la nota guardada a lo que viaja.
 *
 * El nombre del don, el de quien la escribió y sus audios se resuelven
 * **fuera**, de una consulta por página y no una por línea, y llegan aquí como
 * mapas. La alternativa —relaciones cargadas por nota— es la consulta N+1 de
 * siempre.
 *
 * `storage_key` **no sale**: es dónde está el fichero en el disco del
 * servidor, y quien lo escucha no tiene por qué saberlo. Se descarga por su
 * identificador, que es lo que el guard sabe comprobar.
 */
export function toNoteView(
  note: BelieverNote,
  context: {
    giftNames: ReadonlyMap<string, string>;
    authorNames: ReadonlyMap<string, string>;
    audios: ReadonlyMap<string, NoteAudio[]>;
  },
): NoteView {
  return {
    id: note.id,
    churchId: note.churchId,
    believerId: note.believerId,
    kind: note.kind,
    occurredAt: toIsoDay(note.occurredAt),
    told: note.told,
    advice: note.advice,
    giftId: note.giftId,
    giftName: note.giftId ? (context.giftNames.get(note.giftId) ?? null) : null,
    remindAt: note.remindAt?.toISOString() ?? null,
    remindText: note.remindText,
    remindDoneAt: note.remindDoneAt?.toISOString() ?? null,
    audios: (context.audios.get(note.id) ?? []).map(toAudioView),
    authorId: note.authorId,
    authorName: note.authorId ? (context.authorNames.get(note.authorId) ?? null) : null,
    createdAt: note.createdAt.toISOString(),
  };
}

export function toAudioView(audio: NoteAudio): NoteAudioView {
  return {
    id: audio.id,
    noteId: audio.noteId,
    mimeType: audio.mimeType,
    sizeBytes: audio.sizeBytes,
    durationSeconds: audio.durationSeconds,
    recorded: audio.recorded,
    createdAt: audio.createdAt.toISOString(),
  };
}
