import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { toSearchName, type CreateEntryInput, type UpdateEntryInput } from '@navis/shared';
import { Repository } from 'typeorm';

import { JournalEntry } from './journal-entry.entity';

/** Alta, edición y borrado de una entrada del cuaderno (RFC 0017 §6). */
@Injectable()
export class JournalEntriesService {
  constructor(@InjectRepository(JournalEntry) private readonly entries: Repository<JournalEntry>) {}

  // `async` a propósito: `ensureReminder` lanza, y sin ello lo haría de forma
  // síncrona al llamar al método en vez de rechazando la promesa.
  async create(
    churchId: string,
    input: CreateEntryInput,
    authorId: string | null,
  ): Promise<JournalEntry> {
    ensureReminder(input.remindAt ?? null, input.remindText ?? null);

    return this.entries.save(
      this.entries.create({
        churchId,
        title: input.title,
        kind: input.kind,
        occurredAt: input.occurredAt,
        annotation: input.annotation,
        learned: input.learned ?? null,
        searchText: toSearchText(input.title, input.annotation, input.learned ?? null),
        remindAt: input.remindAt ? new Date(input.remindAt) : null,
        remindText: input.remindText ?? null,
        authorId,
      }),
    );
  }

  async update(churchId: string, id: string, input: UpdateEntryInput): Promise<JournalEntry> {
    const entry = await this.require(churchId, id);

    if (input.title !== undefined) entry.title = input.title;
    if (input.kind !== undefined) entry.kind = input.kind;
    if (input.occurredAt !== undefined) entry.occurredAt = input.occurredAt;
    if (input.annotation !== undefined) entry.annotation = input.annotation;
    if (input.learned !== undefined) entry.learned = input.learned;
    if (
      input.title !== undefined ||
      input.annotation !== undefined ||
      input.learned !== undefined
    ) {
      entry.searchText = toSearchText(entry.title, entry.annotation, entry.learned);
    }
    if (input.remindAt !== undefined) {
      entry.remindAt = input.remindAt ? new Date(input.remindAt) : null;
    }
    if (input.remindText !== undefined) entry.remindText = input.remindText;

    // Quitar el recordatorio lo deja también sin marca de atendido: si mañana
    // se pone otro, empieza pendiente y no heredando el de antes.
    if (entry.remindAt === null) entry.remindDoneAt = null;
    else if (input.remindDone !== undefined) {
      entry.remindDoneAt = input.remindDone ? new Date() : null;
    }

    ensureReminder(entry.remindAt?.toISOString() ?? null, entry.remindText);

    return this.entries.save(entry);
  }

  async remove(churchId: string, id: string): Promise<void> {
    await this.entries.softRemove(await this.require(churchId, id));
  }

  async require(churchId: string, id: string): Promise<JournalEntry> {
    const entry = await this.entries.findOne({ where: { id, churchId } });
    if (!entry) throw new NotFoundException('Esa entrada no está en esta iglesia');
    return entry;
  }
}

/** Lo que se guarda en `search_text`: título, anotación y lo aprendido, normalizados (D8). */
export function toSearchText(title: string, annotation: string, learned: string | null): string {
  // La misma normalización que `search_name` de creyentes y `search_text` de
  // profecías, y a propósito: si divergieran, una de las búsquedas dejaría de
  // encontrar acentos.
  return toSearchName([title, annotation, learned ?? ''].join(' '));
}

/** Un recordatorio con mensaje pero sin fecha no recuerda nada (§6.3). */
function ensureReminder(remindAt: string | null, remindText: string | null): void {
  if (remindText && !remindAt) {
    throw new BadRequestException('El recordatorio necesita día y hora');
  }
}
