import type {
  JournalEntry as JournalEntryView,
  JournalEntryAudio as JournalAudioView,
  JournalEntryListItem,
  JournalExportRow,
} from '@navis/shared';

import { toExcerpt } from '../common/excerpt';
import { toIsoDay } from '../database/iso-day';
import type { JournalEntryAudio } from './journal-entry-audio.entity';
import type { JournalEntry } from './journal-entry.entity';

export function toAudioView(audio: JournalEntryAudio): JournalAudioView {
  return {
    id: audio.id,
    entryId: audio.entryId,
    mimeType: audio.mimeType,
    sizeBytes: audio.sizeBytes,
    durationSeconds: audio.durationSeconds,
    recorded: audio.recorded,
    createdAt: audio.createdAt.toISOString(),
  };
}

/**
 * De la entrada guardada a la ficha completa.
 *
 * El nombre de quien la escribió llega **fuera**, resuelto de una consulta por
 * página y no una por fila (mismo motivo que `NotesViewService`).
 */
export function toEntryView(
  entry: JournalEntry,
  context: { authorName: string | null; audios: readonly JournalEntryAudio[] },
): JournalEntryView {
  return {
    id: entry.id,
    churchId: entry.churchId,
    title: entry.title,
    kind: entry.kind,
    occurredAt: toIsoDay(entry.occurredAt),
    annotation: entry.annotation,
    learned: entry.learned,
    remindAt: entry.remindAt?.toISOString() ?? null,
    remindText: entry.remindText,
    remindDoneAt: entry.remindDoneAt?.toISOString() ?? null,
    audios: context.audios.map(toAudioView),
    authorId: entry.authorId,
    authorName: context.authorName,
    createdAt: entry.createdAt.toISOString(),
  };
}

/**
 * La fila del listado, con lo que la ficha necesita ya resuelto (§6.1).
 *
 * `hasAudio` llega aparte porque sale de saber si hubo alguna fila en
 * `journal_entry_audios`, no de cargar la relación entera.
 */
export function toListItem(
  entry: JournalEntry,
  context: { authorName: string | null; hasAudio: boolean },
): JournalEntryListItem {
  return {
    id: entry.id,
    title: entry.title,
    kind: entry.kind,
    occurredAt: toIsoDay(entry.occurredAt),
    excerpt: toExcerpt(entry.annotation),
    hasLearned: entry.learned !== null && entry.learned.trim() !== '',
    hasAudio: context.hasAudio,
    remindAt: entry.remindAt?.toISOString() ?? null,
    remindDoneAt: entry.remindDoneAt?.toISOString() ?? null,
    authorName: context.authorName,
  };
}

/**
 * La fila que se va a un fichero (D12): la del listado con la anotación y lo
 * aprendido enteros en lugar del extracto.
 */
export function toExportRow(
  entry: JournalEntry,
  context: { authorName: string | null; hasAudio: boolean },
): JournalExportRow {
  const item = toListItem(entry, context);

  return {
    id: item.id,
    title: item.title,
    kind: item.kind,
    occurredAt: item.occurredAt,
    hasLearned: item.hasLearned,
    hasAudio: item.hasAudio,
    remindAt: item.remindAt,
    remindDoneAt: item.remindDoneAt,
    authorName: item.authorName,
    annotation: entry.annotation,
    learned: entry.learned,
    remindText: entry.remindText,
    createdAt: entry.createdAt.toISOString(),
  };
}
