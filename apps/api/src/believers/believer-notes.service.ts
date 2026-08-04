import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreateNoteInput, UpdateNoteInput } from '@navis/shared';
import { DataSource, Repository, type EntityManager } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { BelieverLinksService } from './believer-links.service';
import { BelieverNote } from './believer-note.entity';
import { Believer } from './believer.entity';
import { GiftsService } from './gifts.service';

/**
 * Escribir en la bitácora de un hermano.
 *
 * Es el **único** sitio del código que toca `believers.last_note_at` (D4): es
 * un dato derivado —el `MAX(occurred_at)` de sus notas— y se recalcula al
 * crear, al mover la fecha y al borrar. Ningún otro servicio lo escribe; si
 * algún día hay importaciones masivas, harán falta un recálculo y su comando.
 */
@Injectable()
export class BelieverNotesService {
  constructor(
    @InjectRepository(BelieverNote) private readonly notes: Repository<BelieverNote>,
    private readonly dataSource: DataSource,
    private readonly gifts: GiftsService,
    private readonly links: BelieverLinksService,
  ) {}

  /**
   * Escribe la nota y, **en la misma transacción**, recalcula el margen. Si es
   * de tipo «don», se lo añade a la ficha (D8): anotar que alguien lo recibió y
   * que su ficha lo enseñe son la misma acción, no dos.
   */
  async create(
    churchId: string,
    believerId: string,
    input: CreateNoteInput,
    authorId: string | null,
  ): Promise<BelieverNote> {
    const giftId = await this.resolveGift(churchId, input.kind, input.giftId ?? null);

    return this.dataSource.transaction(async (manager) => {
      const note = await manager.save(
        manager.create(BelieverNote, {
          churchId,
          believerId,
          kind: input.kind,
          occurredAt: input.occurredAt,
          told: input.told,
          advice: input.advice ?? null,
          giftId,
          remindAt: input.remindAt ? new Date(input.remindAt) : null,
          remindText: input.remindText ?? null,
          authorId,
        }),
      );

      await refreshLastNote(manager, believerId);
      if (giftId) await this.links.addGift(believerId, giftId, manager);

      return note;
    });
  }

  async update(
    churchId: string,
    believerId: string,
    noteId: string,
    input: UpdateNoteInput,
  ): Promise<BelieverNote> {
    const note = await this.require(believerId, noteId);
    const kind = input.kind ?? note.kind;
    const giftId = await this.resolveGift(
      churchId,
      kind,
      input.giftId === undefined ? note.giftId : input.giftId,
    );

    note.kind = kind;
    note.giftId = giftId;
    if (input.occurredAt !== undefined) note.occurredAt = input.occurredAt;
    if (input.told !== undefined) note.told = input.told;
    if (input.advice !== undefined) note.advice = input.advice;
    if (input.remindAt !== undefined) {
      note.remindAt = input.remindAt ? new Date(input.remindAt) : null;
    }
    if (input.remindText !== undefined) note.remindText = input.remindText;

    // Quitar el recordatorio lo deja también sin marca de atendido: si mañana
    // se pone otro, empieza pendiente y no heredando el de antes.
    if (note.remindAt === null) note.remindDoneAt = null;
    else if (input.remindDone !== undefined) {
      note.remindDoneAt = input.remindDone ? new Date() : null;
    }

    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(note);
      // Mover la fecha puede cambiar cuál es la última: se recalcula siempre.
      await refreshLastNote(manager, believerId);
      if (giftId) await this.links.addGift(believerId, giftId, manager);

      return saved;
    });
  }

  /**
   * Borrado lógico. El don **no** se le quita: borrar la nota de cuando lo
   * recibió no es dejar de tenerlo (§6.3).
   */
  async remove(believerId: string, noteId: string): Promise<void> {
    const note = await this.require(believerId, noteId);

    await this.dataSource.transaction(async (manager) => {
      await manager.softRemove(note);
      await refreshLastNote(manager, believerId);
    });
  }

  async require(believerId: string, noteId: string): Promise<BelieverNote> {
    const note = await this.notes.findOne({ where: { id: noteId, believerId } });
    if (!note) throw new NotFoundException('Esa nota no existe');
    return note;
  }

  /** `giftId` es obligatorio si y solo si el tipo es «don» (D8). */
  private async resolveGift(
    churchId: string,
    kind: string,
    giftId: string | null,
  ): Promise<string | null> {
    if (kind !== 'don') return null;
    if (!giftId) throw new BadRequestException('Elige qué don recibió');

    const gift = await this.gifts.require(churchId, giftId);
    return gift.id;
  }
}

/** `last_note_at` = el día de su nota más reciente, o `null` si no queda ninguna. */
async function refreshLastNote(manager: EntityManager, believerId: string): Promise<void> {
  const row = await manager
    .getRepository(BelieverNote)
    .createQueryBuilder('note')
    .select('MAX(note.occurred_at)', 'last')
    .where('note.believerId = :believerId', { believerId })
    .getRawOne<{ last: string | Date | null }>();

  const last = row?.last ?? null;
  await manager.getRepository(Believer).update(believerId, {
    lastNoteAt: last === null ? null : toIsoDay(last),
  });
}
