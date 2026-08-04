import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { BelieverListItem, BelieversQuery, IsoDate, Paginated } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { nullsFor } from '../database/date-sql';
import { BelieverGift } from './believer-gift.entity';
import { BelieverMinistry } from './believer-ministry.entity';
import { BelieverNote } from './believer-note.entity';
import { Believer } from './believer.entity';
import { applyFilters, SORT_COLUMN } from './believers-filter';
import { giftsByBeliever, toListItem } from './believers.mapper';
import { GiftsService } from './gifts.service';

/** La consulta ya resuelta: lo que llega del DTO con sus valores por defecto. */
export type BelieverPageQuery = BelieversQuery &
  Required<Pick<BelieversQuery, 'page' | 'limit' | 'sort' | 'order'>>;

/**
 * El listado paginado de creyentes, con el aviso de cada uno ya calculado
 * (RFC 0003 §6.1).
 *
 * Está aparte de `BelieversService` porque es otra cosa: allí se escribe una
 * ficha, aquí se arma una consulta con seis filtros, cuatro órdenes y un
 * cálculo de días que no se escribe igual en Postgres que en SQLite.
 */
@Injectable()
export class BelieversPageService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(BelieverMinistry) private readonly ministries: Repository<BelieverMinistry>,
    @InjectRepository(BelieverGift) private readonly links: Repository<BelieverGift>,
    @InjectRepository(BelieverNote) private readonly notes: Repository<BelieverNote>,
    private readonly gifts: GiftsService,
  ) {}

  async findPage(
    churchId: string,
    query: BelieverPageQuery,
    today: IsoDate,
  ): Promise<Paginated<BelieverListItem>> {
    const order = query.order === 'asc' ? 'ASC' : 'DESC';

    // Sin `leftJoinAndSelect`: con relaciones cargadas, `limit`/`offset` de
    // TypeORM pasan a una subconsulta con DISTINCT y Postgres exige que todo lo
    // que se ordena esté en su lista de selección. Las labores y los dones se
    // piden aparte, con los identificadores de la página ya resueltos.
    const builder = applyFilters(
      this.believers.createQueryBuilder('believer').where('believer.churchId = :churchId', {
        churchId,
      }),
      query,
      today,
    )
      .orderBy(SORT_COLUMN[query.sort], order, nullsFor(order))
      // Segundo criterio siempre el nombre: sin él, dos personas con el mismo
      // estado bailan de página en página entre una consulta y la siguiente.
      .addOrderBy('believer.searchName', 'ASC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit);

    const [people, total] = await builder.getManyAndCount();
    const ids = people.map((person) => person.id);

    const [catalog, ministries, links, counts] = await Promise.all([
      this.gifts.ensureFor(churchId),
      this.ministriesOf(ids),
      ids.length ? this.links.find({ where: { believerId: In(ids) } }) : [],
      this.countNotes(ids),
    ]);

    const giftsOf = giftsByBeliever(links, catalog);

    return {
      items: people.map((person) =>
        toListItem({
          believer: person,
          ministries: ministries.get(person.id) ?? [],
          gifts: giftsOf.get(person.id) ?? [],
          notesCount: counts.get(person.id) ?? 0,
          today,
        }),
      ),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  /** Las labores de la página, agrupadas por persona. */
  private async ministriesOf(ids: readonly string[]): Promise<Map<string, string[]>> {
    if (ids.length === 0) return new Map();

    const rows = await this.ministries.find({ where: { believerId: In([...ids]) } });
    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      grouped.set(row.believerId, [...(grouped.get(row.believerId) ?? []), row.ministry]);
    }

    return grouped;
  }

  /** Cuántas notas tiene cada uno, de una consulta agrupada y no de N. */
  private async countNotes(ids: readonly string[]): Promise<Map<string, number>> {
    if (ids.length === 0) return new Map();

    const rows = await this.notes
      .createQueryBuilder('note')
      .select('note.believer_id', 'believerId')
      .addSelect('COUNT(*)', 'total')
      .where('note.believerId IN (:...ids)', { ids: [...ids] })
      .groupBy('note.believer_id')
      .getRawMany<{ believerId: string; total: string | number }>();

    return new Map(rows.map((row) => [row.believerId, Number(row.total)]));
  }
}
