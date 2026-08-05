import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { BelieverListItem, BelieversQuery, IsoDate, Paginated } from '@navis/shared';
import { Repository } from 'typeorm';

import { nullsFor } from '../database/date-sql';
import { BelieverRowsService } from './believer-rows.service';
import { Believer } from './believer.entity';
import { applyFilters, SORT_COLUMN } from './believers-filter';

/** La consulta ya resuelta: lo que llega del DTO con sus valores por defecto. */
export type BelieverPageQuery = BelieversQuery &
  Required<Pick<BelieversQuery, 'page' | 'limit' | 'sort' | 'order'>>;

/**
 * El listado paginado de creyentes, con el aviso de cada uno ya calculado
 * (RFC 0003 §6.1).
 *
 * Está aparte de `BelieversService` porque es otra cosa: allí se escribe una
 * ficha, aquí se arma una consulta con seis filtros, cuatro órdenes y un
 * cálculo de días que no se escribe igual en Postgres que en SQLite. Lo que
 * viene después —labores, dones y cuentas— lo pone `BelieverRowsService`, que
 * es lo mismo que necesita la exportación (RFC 0009).
 */
@Injectable()
export class BelieversPageService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    private readonly rows: BelieverRowsService,
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

    return {
      items: await this.rows.of(churchId, people, today),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }
}
