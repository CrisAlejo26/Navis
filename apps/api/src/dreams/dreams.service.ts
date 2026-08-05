import { Injectable } from '@nestjs/common';
import type { CreateDreamInput, Dream as DreamView, UpdateDreamInput } from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import { blankToNull, ensureOrder, toSearchText } from './dream-fields';
import { DreamEmotionsRepository } from './dream-emotions.repository';
import { toDreamView } from './dreams.mapper';
import { DreamsRepository } from './dreams.repository';
import { EmotionsRepository } from './emotions.repository';

/**
 * Alta, edición y borrado de un sueño (RFC 0005 §6).
 *
 * Todo pasa por `DreamsRepository`, que exige el dueño: aquí no se inyecta
 * `Repository<Dream>` (D1). Devuelve la ficha ya montada porque las emociones
 * no viven en la relación —la tabla puente guarda identificadores— y armarla
 * en el controlador repartiría la misma consulta por tres sitios.
 */
@Injectable()
export class DreamsService {
  constructor(
    private readonly dreams: DreamsRepository,
    private readonly links: DreamEmotionsRepository,
    private readonly emotions: EmotionsRepository,
  ) {}

  get(ownerId: string, id: string): Promise<DreamView> {
    return this.view(ownerId, id);
  }

  // `async` a propósito: `ensureOrder` lanza, y sin ello lo haría de forma
  // síncrona al llamar al método en vez de rechazando la promesa (CLAUDE.md).
  async create(ownerId: string, input: CreateDreamInput): Promise<DreamView> {
    const title = blankToNull(input.title);
    const dream = await this.dreams.save(
      this.dreams.create(ownerId, {
        title,
        body: input.body,
        searchText: toSearchText(title, input.body, null),
        dreamedAt: input.dreamedAt,
        interpretation: null,
        fulfilledAt: null,
        fulfillmentMeaning: null,
      }),
    );

    await this.setEmotions(ownerId, dream.id, input.emotionIds);

    return this.view(ownerId, dream.id);
  }

  /**
   * Marcar como cumplido es poner la fecha; quitarla lo vuelve a abrir **y se
   * lleva por delante lo que significó** (D10): un sueño que ya no está
   * cumplido no puede conservar la frase que explicaba su cumplimiento.
   */
  async update(ownerId: string, id: string, input: UpdateDreamInput): Promise<DreamView> {
    const dream = await this.dreams.require(ownerId, id);

    if (input.title !== undefined) dream.title = blankToNull(input.title);
    if (input.body !== undefined) dream.body = input.body;
    if (input.interpretation !== undefined) {
      dream.interpretation = blankToNull(input.interpretation);
    }
    if (touchesSearch(input)) {
      dream.searchText = toSearchText(dream.title, dream.body, dream.interpretation);
    }
    if (input.dreamedAt !== undefined) dream.dreamedAt = input.dreamedAt;

    if (input.fulfilledAt !== undefined) {
      dream.fulfilledAt = input.fulfilledAt;
      if (input.fulfilledAt === null) dream.fulfillmentMeaning = null;
    }
    if (input.fulfillmentMeaning !== undefined && dream.fulfilledAt !== null) {
      dream.fulfillmentMeaning = blankToNull(input.fulfillmentMeaning);
    }

    // Con la fila delante ya se pueden comparar las dos fechas, cosa que el
    // esquema de `shared` no puede hacer cuando solo llega una de ellas.
    ensureOrder(toIsoDay(dream.dreamedAt), dream.fulfilledAt);

    await this.dreams.save(dream);
    await this.setEmotions(ownerId, dream.id, input.emotionIds);

    return this.view(ownerId, id);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.dreams.softRemove(await this.dreams.require(ownerId, id));
  }

  /**
   * Las emociones que de verdad puede usar: las de serie y las suyas.
   *
   * Se filtra en vez de rechazar la petición entera porque un identificador
   * ajeno o borrado no es un ataque, es una pestaña vieja. Lo que no puede
   * pasar es que acabe pegado a su sueño.
   */
  private async setEmotions(
    ownerId: string,
    dreamId: string,
    emotionIds: readonly string[] | undefined,
  ): Promise<void> {
    if (emotionIds === undefined) return;

    const usable = await this.emotions.findUsable(ownerId, emotionIds);
    await this.links.setFor(
      dreamId,
      usable.map((emotion) => emotion.id),
    );
  }

  private async view(ownerId: string, id: string): Promise<DreamView> {
    const dream = await this.dreams.requireFull(ownerId, id);
    const emotions = await this.links.forDreams(ownerId, [id]);

    return toDreamView(dream, emotions.get(id) ?? []);
  }
}

/** Si el cambio toca algo de lo que se busca. Reescribir siempre sería igual de
    correcto, pero deja el texto de búsqueda tocado en cada cambio de fecha. */
function touchesSearch(input: UpdateDreamInput): boolean {
  return (
    input.title !== undefined || input.body !== undefined || input.interpretation !== undefined
  );
}
