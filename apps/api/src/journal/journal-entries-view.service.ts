import { Injectable } from '@nestjs/common';
import type {
  JournalEntry as JournalEntryView,
  JournalEntryListItem,
  JournalExportRow,
} from '@navis/shared';

import { UsersService } from '../users/users.service';
import { JournalAudiosService } from './journal-audios.service';
import { toEntryView, toExportRow, toListItem } from './journal-entries.mapper';
import type { JournalEntry } from './journal-entry.entity';

/**
 * Vestir un puñado de entradas con lo que no está en su fila: el nombre de
 * quien las escribió y sus audios.
 *
 * Son **dos consultas por página**, no dos por entrada. Vive aparte del
 * controlador porque lo necesitan el listado, la exportación y la ficha, y
 * porque es justo el sitio donde es fácil colar sin querer una consulta N+1
 * (mismo motivo que `NotesViewService`, RFC 0003).
 */
@Injectable()
export class JournalEntriesViewService {
  constructor(
    private readonly users: UsersService,
    private readonly audios: JournalAudiosService,
  ) {}

  async listItems(entries: readonly JournalEntry[]): Promise<JournalEntryListItem[]> {
    if (entries.length === 0) return [];

    const [authorNames, audios] = await this.context(entries);
    return entries.map((entry) =>
      toListItem(entry, {
        authorName: entry.authorId ? (authorNames.get(entry.authorId) ?? null) : null,
        hasAudio: (audios.get(entry.id) ?? []).length > 0,
      }),
    );
  }

  async exportRows(entries: readonly JournalEntry[]): Promise<JournalExportRow[]> {
    if (entries.length === 0) return [];

    const [authorNames, audios] = await this.context(entries);
    return entries.map((entry) =>
      toExportRow(entry, {
        authorName: entry.authorId ? (authorNames.get(entry.authorId) ?? null) : null,
        hasAudio: (audios.get(entry.id) ?? []).length > 0,
      }),
    );
  }

  async one(entry: JournalEntry): Promise<JournalEntryView> {
    const [authorNames, audios] = await this.context([entry]);
    return toEntryView(entry, {
      authorName: entry.authorId ? (authorNames.get(entry.authorId) ?? null) : null,
      audios: audios.get(entry.id) ?? [],
    });
  }

  private context(
    entries: readonly JournalEntry[],
  ): Promise<[Map<string, string>, Map<string, JournalEntry['audios']>]> {
    return Promise.all([
      this.users.namesOf(entries.map((entry) => entry.authorId)),
      this.audios.forEntries(entries.map((entry) => entry.id)),
    ]);
  }
}
