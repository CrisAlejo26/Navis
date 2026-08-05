import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { BelieverListItem, IsoDate } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { BelieverGift } from './believer-gift.entity';
import { BelieverMinistry } from './believer-ministry.entity';
import { BelieverNote } from './believer-note.entity';
import type { Believer } from './believer.entity';
import { giftsByBeliever, toListItem } from './believers.mapper';
import { GiftsService } from './gifts.service';

/**
 * De filas de `believers` a fichas completas: labores, dones y cuántas notas
 * tiene cada uno.
 *
 * Está aparte porque lo usan **dos** consultas distintas —la página del
 * listado y la exportación entera (RFC 0009 D3)— y son las mismas cuatro
 * consultas en los dos casos. Todo se pide de una vez para el lote, nunca una
 * por persona.
 */
@Injectable()
export class BelieverRowsService {
  constructor(
    @InjectRepository(BelieverMinistry) private readonly ministries: Repository<BelieverMinistry>,
    @InjectRepository(BelieverGift) private readonly links: Repository<BelieverGift>,
    @InjectRepository(BelieverNote) private readonly notes: Repository<BelieverNote>,
    private readonly gifts: GiftsService,
  ) {}

  async of(
    churchId: string,
    people: readonly Believer[],
    today: IsoDate,
  ): Promise<BelieverListItem[]> {
    const ids = people.map((person) => person.id);

    const [catalog, ministries, links, counts] = await Promise.all([
      this.gifts.ensureFor(churchId),
      this.ministriesOf(ids),
      this.giftLinksOf(ids),
      this.countNotes(ids),
    ]);

    const giftsOf = giftsByBeliever(links, catalog);

    return people.map((person) =>
      toListItem({
        believer: person,
        ministries: ministries.get(person.id) ?? [],
        gifts: giftsOf.get(person.id) ?? [],
        notesCount: counts.get(person.id) ?? 0,
        today,
      }),
    );
  }

  /** Las labores del lote, agrupadas por persona. */
  private async ministriesOf(ids: readonly string[]): Promise<Map<string, string[]>> {
    const unique = usable(ids);
    if (unique.length === 0) return new Map();

    const rows = await this.ministries.find({ where: { believerId: In(unique) } });
    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      grouped.set(row.believerId, [...(grouped.get(row.believerId) ?? []), row.ministry]);
    }

    return grouped;
  }

  private giftLinksOf(ids: readonly string[]): Promise<BelieverGift[]> {
    const unique = usable(ids);
    return unique.length === 0
      ? Promise.resolve([])
      : this.links.find({ where: { believerId: In(unique) } });
  }

  /** Cuántas notas tiene cada uno, de una consulta agrupada y no de N. */
  private async countNotes(ids: readonly string[]): Promise<Map<string, number>> {
    const unique = usable(ids);
    if (unique.length === 0) return new Map();

    const rows = await this.notes
      .createQueryBuilder('note')
      .select('note.believer_id', 'believerId')
      .addSelect('COUNT(*)', 'total')
      .where('note.believerId IN (:...ids)', { ids: unique })
      .groupBy('note.believer_id')
      .getRawMany<{ believerId: string; total: string | number }>();

    return new Map(rows.map((row) => [row.believerId, Number(row.total)]));
  }
}

/**
 * Los identificadores que se pueden meter en un `IN`.
 *
 * Un `IN ('')` contra una columna `uuid` revienta en Postgres y a SQLite le da
 * igual, porque ahí todo es texto (CLAUDE.md): los vacíos se filtran **antes**
 * de la consulta y no después.
 */
function usable(ids: readonly string[]): string[] {
  return [...new Set(ids)].filter(Boolean);
}
