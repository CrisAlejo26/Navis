import { Injectable } from '@nestjs/common';
import type { DreamEmotionCount, DreamsStats } from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import { DreamEmotionsRepository } from './dream-emotions.repository';
import { summarize, type DreamStatsRow } from './dream-stats';
import { toEmotionView } from './dreams.mapper';
import { DreamsRepository } from './dreams.repository';
import { EmotionsRepository } from './emotions.repository';

/**
 * Las cuentas de la portada (RFC 0005 §6.2).
 *
 * Se piden **todas** las filas de esa persona, pero solo las cuatro columnas
 * que hacen falta: ni el cuerpo, ni la interpretación, ni el texto de búsqueda,
 * que es lo que pesa. Las cuentas no pueden derivarse del listado paginado: la
 * página 1 no sabe nada de las otras cuatrocientas (D15).
 */
@Injectable()
export class DreamStatsService {
  constructor(
    private readonly dreams: DreamsRepository,
    private readonly links: DreamEmotionsRepository,
    private readonly emotions: EmotionsRepository,
  ) {}

  async stats(ownerId: string): Promise<DreamsStats> {
    const rows = await this.dreams
      .scoped(ownerId)
      .select(['dream.id', 'dream.title', 'dream.dreamedAt', 'dream.fulfilledAt'])
      .getMany();

    const byEmotion = await this.emotionCounts(
      ownerId,
      rows.map((row) => row.id),
    );

    return summarize(rows.map(toStatsRow), toIsoDay(new Date()), byEmotion);
  }

  /** El mapa de emociones: solo las que se han usado, con su color (§7.3). */
  private async emotionCounts(
    ownerId: string,
    dreamIds: readonly string[],
  ): Promise<DreamEmotionCount[]> {
    const counts = await this.links.countsByEmotion(dreamIds);
    if (counts.size === 0) return [];

    const available = await this.emotions.findAvailable(ownerId);

    return available
      .filter((emotion) => counts.has(emotion.id))
      .map((emotion) => ({ ...toEmotionView(emotion), count: counts.get(emotion.id) ?? 0 }));
  }
}

/** Las fechas, como día de calendario: desde Postgres pueden venir como `Date`. */
function toStatsRow(row: {
  id: string;
  title: string | null;
  dreamedAt: string;
  fulfilledAt: string | null;
}): DreamStatsRow {
  return {
    id: row.id,
    title: row.title,
    dreamedAt: toIsoDay(row.dreamedAt),
    fulfilledAt: row.fulfilledAt ? toIsoDay(row.fulfilledAt) : null,
  };
}
