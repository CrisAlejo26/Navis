import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DEFAULT_DREAM_SORT,
  DEFAULT_PAGE_SIZE,
  type DreamListItem,
  type DreamsQuery,
  type Paginated,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { DreamAudio } from './dream-audio.entity';
import { DreamEmotionsRepository } from './dream-emotions.repository';
import { applyFilters, applyOrder } from './dreams-filter';
import { toListItem } from './dreams.mapper';
import { DreamsRepository } from './dreams.repository';

/** El listado paginado, con sus filtros y su orden (RFC 0005 §6.1). */
@Injectable()
export class DreamsPageService {
  constructor(
    private readonly dreams: DreamsRepository,
    private readonly links: DreamEmotionsRepository,
    @InjectRepository(DreamAudio) private readonly audios: Repository<DreamAudio>,
  ) {}

  async list(ownerId: string, query: DreamsQuery): Promise<Paginated<DreamListItem>> {
    const page = Math.max(1, query.page ?? 1);
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const emotions = query.emotion ?? [];
    const emotionDreamIds = emotions.length > 0 ? await this.links.dreamIdsWith(emotions) : null;

    const builder = this.dreams.scoped(ownerId);
    applyFilters(builder, query, emotionDreamIds);
    applyOrder(builder, query.sort ?? DEFAULT_DREAM_SORT, query.order ?? 'desc');

    // Sin relaciones cargadas: con ellas, `take`/`skip` pasan a una subconsulta
    // con `DISTINCT` y Postgres exige que lo ordenado esté seleccionado
    // (CLAUDE.md). Emociones y audios se piden aparte, ya con los ids de la
    // página.
    const [rows, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const ids = rows.map((row) => row.id);
    const [byDream, audios] = await Promise.all([
      this.links.forDreams(ownerId, ids),
      this.audioCounts(ids),
    ]);

    return {
      items: rows.map((row) => toListItem(row, byDream.get(row.id) ?? [], audios.get(row.id) ?? 0)),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  /** Cuántos audios lleva cada sueño de la página, de una sola consulta. */
  private async audioCounts(ids: readonly string[]): Promise<Map<string, number>> {
    // Un `IN ('')` contra una columna `uuid` revienta en Postgres (CLAUDE.md):
    // los identificadores vacíos se filtran antes de la consulta.
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return new Map();

    const rows = await this.audios.find({
      where: { dreamId: In(unique) },
      select: { dreamId: true },
    });

    const counts = new Map<string, number>();
    for (const row of rows) counts.set(row.dreamId, (counts.get(row.dreamId) ?? 0) + 1);

    return counts;
  }
}
