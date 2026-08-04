import { Injectable } from '@nestjs/common';
import type { BelieverNote as NoteView } from '@navis/shared';

import { UsersService } from '../users/users.service';
import type { BelieverNote } from './believer-note.entity';
import { GiftsService } from './gifts.service';
import { NoteAudiosService } from './note-audios.service';
import { toNoteView } from './notes.mapper';

/**
 * Vestir un puñado de notas con lo que no está en su fila: el nombre del don,
 * el de quien la escribió y sus audios.
 *
 * Son **tres consultas por página**, no tres por nota. Vive aparte del
 * controlador porque lo necesitan sus cuatro endpoints y porque es justo el
 * sitio donde es fácil colar sin querer una consulta N+1.
 */
@Injectable()
export class NotesViewService {
  constructor(
    private readonly gifts: GiftsService,
    private readonly users: UsersService,
    private readonly audios: NoteAudiosService,
  ) {}

  async of(churchId: string, notes: readonly BelieverNote[]): Promise<NoteView[]> {
    if (notes.length === 0) return [];

    const [catalog, authorNames, audios] = await Promise.all([
      this.gifts.list(churchId),
      this.users.namesOf(notes.map((note) => note.authorId)),
      this.audios.forNotes(notes.map((note) => note.id)),
    ]);

    const giftNames = new Map(catalog.map((gift) => [gift.id, gift.name]));
    return notes.map((note) => toNoteView(note, { giftNames, authorNames, audios }));
  }

  async one(churchId: string, note: BelieverNote): Promise<NoteView> {
    const [view] = await this.of(churchId, [note]);
    return view;
  }
}
