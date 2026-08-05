import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { DreamExportRow, DreamListItem } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { DreamAudio } from './dream-audio.entity';
import { DreamEmotionsRepository } from './dream-emotions.repository';
import type { Dream } from './dream.entity';
import { toExportRow, toListItem } from './dreams.mapper';

/**
 * De filas de `dreams` a lo que consume la interfaz, en sus dos formas: la del
 * listado (con extracto) y la de la exportación (con el cuerpo, la
 * interpretación y lo que significó).
 *
 * Está aparte porque las dos necesitan **lo mismo** de la base de datos —las
 * emociones y cuántos audios lleva cada sueño— y son dos consultas para todo
 * el lote, nunca dos por sueño (RFC 0009 D7).
 */
@Injectable()
export class DreamRowsService {
  constructor(
    private readonly links: DreamEmotionsRepository,
    @InjectRepository(DreamAudio) private readonly audios: Repository<DreamAudio>,
  ) {}

  async listItems(ownerId: string, rows: readonly Dream[]): Promise<DreamListItem[]> {
    const { emotions, audios } = await this.extras(
      ownerId,
      rows.map((row) => row.id),
    );

    return rows.map((row) => toListItem(row, emotions.get(row.id) ?? [], audios.get(row.id) ?? 0));
  }

  async exportRows(ownerId: string, rows: readonly Dream[]): Promise<DreamExportRow[]> {
    const { emotions, audios } = await this.extras(
      ownerId,
      rows.map((row) => row.id),
    );

    return rows.map((row) => toExportRow(row, emotions.get(row.id) ?? [], audios.get(row.id) ?? 0));
  }

  private async extras(ownerId: string, ids: readonly string[]) {
    const [emotions, audios] = await Promise.all([
      this.links.forDreams(ownerId, ids),
      this.audioCounts(ids),
    ]);

    return { emotions, audios };
  }

  /** Cuántos audios lleva cada sueño del lote, de una sola consulta. */
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
