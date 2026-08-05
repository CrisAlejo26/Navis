import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { DreamEmotion } from './dream-emotion.entity';
import type { Emotion } from './emotion.entity';
import { EmotionsRepository } from './emotions.repository';

/**
 * La unión entre sueños y emociones (RFC 0005 §5.3).
 *
 * Se lee en bloque para una página de sueños y no una consulta por fila: con
 * veinte sueños en pantalla, lo segundo son veintiuna consultas.
 *
 * Todo lo que sale de aquí pasa por `EmotionsRepository`, que acota al dueño:
 * este repositorio no devuelve emociones por su cuenta.
 */
@Injectable()
export class DreamEmotionsRepository {
  constructor(
    @InjectRepository(DreamEmotion) private readonly links: Repository<DreamEmotion>,
    private readonly emotions: EmotionsRepository,
  ) {}

  /**
   * Deja el sueño exactamente con esas emociones.
   *
   * Se borra el juego entero y se vuelve a escribir, como `believer_gifts`: son
   * cuatro filas y el índice único ya impide repetir. El borrado es **duro** y
   * no lógico a propósito: una fila con `deleted_at` seguiría ocupando su sitio
   * en el índice único y volver a poner la misma emoción reventaría.
   */
  async setFor(dreamId: string, emotionIds: readonly string[]): Promise<void> {
    await this.links.delete({ dreamId });
    if (emotionIds.length === 0) return;

    await this.links.insert(emotionIds.map((emotionId) => ({ dreamId, emotionId })));
  }

  /** Las emociones de cada sueño de la página, en dos consultas y no en veinte. */
  async forDreams(ownerId: string, dreamIds: readonly string[]): Promise<Map<string, Emotion[]>> {
    const links = await this.linksOf(dreamIds);
    if (links.length === 0) return new Map();

    const emotions = await this.emotions.findUsable(
      ownerId,
      links.map((link) => link.emotionId),
    );
    const byId = new Map(emotions.map((emotion) => [emotion.id, emotion]));

    const grouped = new Map<string, Emotion[]>();
    for (const link of links) {
      const emotion = byId.get(link.emotionId);
      if (!emotion) continue;
      grouped.set(link.dreamId, [...(grouped.get(link.dreamId) ?? []), emotion]);
    }

    for (const list of grouped.values()) list.sort((a, b) => a.position - b.position);

    return grouped;
  }

  /**
   * Cuántas veces aparece cada emoción en esos sueños.
   *
   * Se cuenta en JS y no con un `GROUP BY` contra un `JOIN` a `dreams`: los
   * sueños de una persona caben de sobra en memoria, y así no hay que escribir
   * SQL que se comporte igual en los dos motores (el mismo motivo que D14).
   */
  async countsByEmotion(dreamIds: readonly string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();

    for (const link of await this.linksOf(dreamIds)) {
      counts.set(link.emotionId, (counts.get(link.emotionId) ?? 0) + 1);
    }

    return counts;
  }

  /** Los sueños que llevan cualquiera de esas emociones. Para el filtro. */
  async dreamIdsWith(emotionIds: readonly string[]): Promise<string[]> {
    if (emotionIds.length === 0) return [];

    const rows = await this.links.find({
      where: { emotionId: In([...emotionIds]) },
      select: { dreamId: true },
    });

    return [...new Set(rows.map((row) => row.dreamId))];
  }

  private async linksOf(dreamIds: readonly string[]): Promise<DreamEmotion[]> {
    if (dreamIds.length === 0) return [];
    return this.links.find({ where: { dreamId: In([...dreamIds]) } });
  }
}
