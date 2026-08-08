import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { believerName, DASHBOARD_NOTES_PREVIEW, type DashboardNote } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { BelieverNote } from '../believers/believer-note.entity';
import { Believer } from '../believers/believer.entity';

/** Cuánto del texto entra en la tarjeta antes de recortarlo con puntos suspensivos. */
const EXCERPT_LENGTH = 140;

/**
 * Las últimas notas escritas en la iglesia, para la tarjeta de la portada.
 *
 * Trae el `excerpt`, no el texto entero (como el `ProphecyListItem` de
 * profecías o el `ListMember` de una lista): guardar desde la tarjeta no tiene
 * sentido aquí, así que no hace falta el texto completo.
 */
@Injectable()
export class DashboardNotesService {
  constructor(
    @InjectRepository(BelieverNote) private readonly notes: Repository<BelieverNote>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
  ) {}

  async recent(churchId: string): Promise<DashboardNote[]> {
    const rows = await this.notes.find({
      where: { churchId },
      order: { occurredAt: 'DESC', createdAt: 'DESC' },
      take: DASHBOARD_NOTES_PREVIEW,
    });
    if (rows.length === 0) return [];

    const people = await this.believers.find({
      where: { id: In(rows.map((one) => one.believerId)) },
    });
    const byId = new Map(people.map((one) => [one.id, one]));

    return rows.map((note) => {
      const believer = byId.get(note.believerId);

      return {
        id: note.id,
        believerId: note.believerId,
        believerName: believer ? believerName(believer) : '—',
        kind: note.kind,
        occurredAt: note.occurredAt,
        excerpt:
          note.told.length > EXCERPT_LENGTH ? `${note.told.slice(0, EXCERPT_LENGTH)}…` : note.told,
      };
    });
  }
}
