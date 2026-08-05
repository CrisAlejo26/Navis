import { Injectable } from '@nestjs/common';
import type {
  CreateEmotionInput,
  Emotion as EmotionView,
  EmotionWithCount,
  UpdateEmotionInput,
} from '@navis/shared';

import { DreamEmotionsRepository } from './dream-emotions.repository';
import { toEmotionView } from './dreams.mapper';
import { DreamsRepository } from './dreams.repository';
import { EmotionsRepository } from './emotions.repository';

/**
 * El vocabulario de emociones (RFC 0005 §5.2).
 *
 * Las doce de serie se ven y no se tocan; las propias se crean, se renombran y
 * se borran. Quien decide cuál es cuál es `EmotionsRepository.requireOwn`, que
 * responde 403 ante una de serie (D6).
 */
@Injectable()
export class EmotionsService {
  constructor(
    private readonly emotions: EmotionsRepository,
    private readonly links: DreamEmotionsRepository,
    private readonly dreams: DreamsRepository,
  ) {}

  /** Las que puede usar, con cuántos sueños suyos lleva cada una. */
  async list(ownerId: string): Promise<EmotionWithCount[]> {
    const [available, counts] = await Promise.all([
      this.emotions.findAvailable(ownerId),
      this.dreams.idsOf(ownerId).then((ids) => this.links.countsByEmotion(ids)),
    ]);

    return available.map((emotion) => ({
      ...toEmotionView(emotion),
      count: counts.get(emotion.id) ?? 0,
    }));
  }

  async create(ownerId: string, input: CreateEmotionInput): Promise<EmotionView> {
    const emotion = await this.emotions.save(this.emotions.create(ownerId, input));
    return toEmotionView(emotion);
  }

  async update(ownerId: string, id: string, input: UpdateEmotionInput): Promise<EmotionView> {
    const emotion = await this.emotions.requireOwn(ownerId, id);

    if (input.name !== undefined) emotion.name = input.name;
    if (input.accent !== undefined) emotion.accent = input.accent;

    return toEmotionView(await this.emotions.save(emotion));
  }

  /**
   * Borra la emoción, no los sueños.
   *
   * Las filas de la unión se quedan apuntando a una emoción con `deleted_at`, y
   * `forDreams` no la devuelve porque `findUsable` ya no la encuentra: el sueño
   * se queda con las demás y nadie ve un hueco (D6).
   */
  async remove(ownerId: string, id: string): Promise<void> {
    await this.emotions.softRemove(await this.emotions.requireOwn(ownerId, id));
  }
}
