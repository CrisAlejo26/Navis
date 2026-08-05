import { BadRequestException, Injectable } from '@nestjs/common';
import { toSearchName, type CreateProphecyInput, type UpdateProphecyInput } from '@navis/shared';

import { toIsoDay } from '../database/iso-day';
import { PropheciesRepository } from './prophecies.repository';
import type { Prophecy } from './prophecy.entity';

/**
 * Alta, edición y borrado de una profecía (RFC 0004 §6).
 *
 * Todo pasa por `PropheciesRepository`, que exige el dueño: aquí no se inyecta
 * `Repository<Prophecy>` (D1).
 */
@Injectable()
export class PropheciesService {
  constructor(private readonly prophecies: PropheciesRepository) {}

  get(ownerId: string, id: string): Promise<Prophecy> {
    return this.prophecies.requireWithFulfillments(ownerId, id);
  }

  // `async` a propósito: `ensureOrder` lanza, y sin ello lo haría de forma
  // síncrona al llamar al método en vez de rechazando la promesa.
  async create(ownerId: string, input: CreateProphecyInput): Promise<Prophecy> {
    ensureOrder(input.receivedAt, input.fulfilledAt ?? null);

    return this.prophecies.save(
      this.prophecies.create(ownerId, {
        title: input.title,
        body: input.body,
        searchText: toSearchText(input.title, input.body),
        receivedAt: input.receivedAt,
        fulfilledAt: input.fulfilledAt ?? null,
        lastFulfillmentAt: null,
      }),
    );
  }

  /**
   * Marcar como cumplida es poner una fecha y desmarcarla es quitarla (D6). Los
   * cumplimientos parciales **no se tocan** al cerrarla ni al reabrirla: que se
   * fuera cumpliendo a trozos por el camino sigue siendo verdad.
   */
  async update(ownerId: string, id: string, input: UpdateProphecyInput): Promise<Prophecy> {
    const prophecy = await this.prophecies.require(ownerId, id);

    if (input.title !== undefined) prophecy.title = input.title;
    if (input.body !== undefined) prophecy.body = input.body;
    if (input.title !== undefined || input.body !== undefined) {
      prophecy.searchText = toSearchText(prophecy.title, prophecy.body);
    }
    if (input.receivedAt !== undefined) prophecy.receivedAt = input.receivedAt;
    if (input.fulfilledAt !== undefined) prophecy.fulfilledAt = input.fulfilledAt;

    // Con la fila delante ya se pueden comparar las dos fechas, cosa que el
    // esquema de `shared` no puede hacer cuando solo llega una de ellas.
    ensureOrder(toIsoDay(prophecy.receivedAt), prophecy.fulfilledAt);

    return this.prophecies.save(prophecy);
  }

  async remove(ownerId: string, id: string): Promise<void> {
    await this.prophecies.softRemove(await this.prophecies.require(ownerId, id));
  }
}

/** Lo que se guarda en `search_text`: título y cuerpo juntos, normalizados (D13). */
export function toSearchText(title: string, body: string): string {
  // La misma normalización que `search_name` de creyentes, y a propósito: si
  // divergieran, una de las dos búsquedas dejaría de encontrar acentos.
  return toSearchName(`${title} ${body}`);
}

/** No se puede haber cumplido antes de recibirse (D7). */
function ensureOrder(receivedAt: string, fulfilledAt: string | null): void {
  if (fulfilledAt && toIsoDay(fulfilledAt) < receivedAt) {
    throw new BadRequestException('No puede haberse cumplido antes de recibirse');
  }
}
