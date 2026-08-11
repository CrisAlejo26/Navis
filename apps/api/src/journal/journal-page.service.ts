import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DEFAULT_JOURNAL_SORT,
  DEFAULT_PAGE_SIZE,
  type JournalEntryListItem,
  type JournalQuery,
  type Paginated,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { applyFilters, applyOrder } from './journal-filter';
import { JournalEntriesViewService } from './journal-entries-view.service';
import { JournalEntry } from './journal-entry.entity';

/** El listado paginado del cuaderno, con sus filtros y su orden (§6.1). */
@Injectable()
export class JournalPageService {
  constructor(
    @InjectRepository(JournalEntry) private readonly entries: Repository<JournalEntry>,
    private readonly view: JournalEntriesViewService,
  ) {}

  async list(churchId: string, query: JournalQuery): Promise<Paginated<JournalEntryListItem>> {
    const today = toIsoDay(new Date());
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const builder = this.entries
      .createQueryBuilder('entry')
      .where('entry.churchId = :churchId', { churchId });
    applyFilters(builder, query, today);
    applyOrder(builder, query.sort ?? DEFAULT_JOURNAL_SORT, query.order ?? 'desc');

    // Sin relaciones cargadas: con ellas, `take`/`skip` pasan a una subconsulta
    // con `DISTINCT` y Postgres exige que lo ordenado esté seleccionado
    // (CLAUDE.md). Los audios y el autor se piden aparte, ya con los ids de la
    // página.
    const [rows, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: await this.view.listItems(rows),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }
}
