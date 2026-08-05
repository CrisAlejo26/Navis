import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreateFulfillmentInput, UpdateFulfillmentInput } from '@navis/shared';
import { Repository } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { PropheciesRepository } from './prophecies.repository';
import { ProphecyFulfillment } from './prophecy-fulfillment.entity';

/**
 * Los **cumplimientos parciales** de una profecía (RFC 0004 D4).
 *
 * Este es el **único** servicio que escribe `last_fulfillment_at`. Es un dato
 * derivado y por tanto se puede desincronizar, así que se recalcula aquí al
 * crear, al mover la fecha y al borrar, y no se toca desde ningún otro sitio —
 * la misma disciplina que `last_note_at` en la RFC 0003 D4.
 *
 * Toda consulta lleva `ownerId`, también en la tabla hija: por eso la columna
 * está denormalizada (D1).
 */
@Injectable()
export class FulfillmentsService {
  constructor(
    @InjectRepository(ProphecyFulfillment)
    private readonly fulfillments: Repository<ProphecyFulfillment>,
    private readonly prophecies: PropheciesRepository,
  ) {}

  async create(
    ownerId: string,
    prophecyId: string,
    input: CreateFulfillmentInput,
  ): Promise<ProphecyFulfillment> {
    const prophecy = await this.prophecies.require(ownerId, prophecyId);
    ensureAfterReception(toIsoDay(prophecy.receivedAt), input.occurredAt);

    const saved = await this.fulfillments.save(
      this.fulfillments.create({
        prophecyId,
        ownerId,
        text: input.text,
        occurredAt: input.occurredAt,
      }),
    );

    await this.refreshLast(ownerId, prophecyId);
    return saved;
  }

  async update(
    ownerId: string,
    prophecyId: string,
    id: string,
    input: UpdateFulfillmentInput,
  ): Promise<ProphecyFulfillment> {
    const prophecy = await this.prophecies.require(ownerId, prophecyId);
    const fulfillment = await this.require(ownerId, prophecyId, id);

    if (input.text !== undefined) fulfillment.text = input.text;
    if (input.occurredAt !== undefined) {
      ensureAfterReception(toIsoDay(prophecy.receivedAt), input.occurredAt);
      fulfillment.occurredAt = input.occurredAt;
    }

    const saved = await this.fulfillments.save(fulfillment);
    await this.refreshLast(ownerId, prophecyId);
    return saved;
  }

  async remove(ownerId: string, prophecyId: string, id: string): Promise<void> {
    await this.fulfillments.softRemove(await this.require(ownerId, prophecyId, id));
    await this.refreshLast(ownerId, prophecyId);
  }

  /** El cumplimiento, comprobando dueño y profecía. 404 si falla cualquiera. */
  private async require(
    ownerId: string,
    prophecyId: string,
    id: string,
  ): Promise<ProphecyFulfillment> {
    const fulfillment = await this.fulfillments.findOne({ where: { id, prophecyId, ownerId } });
    if (!fulfillment) throw new NotFoundException('Ese cumplimiento no existe');
    return fulfillment;
  }

  /** Recalcula `last_fulfillment_at`. El único sitio donde se escribe (D4). */
  private async refreshLast(ownerId: string, prophecyId: string): Promise<void> {
    const row = await this.fulfillments
      .createQueryBuilder('fulfillment')
      .select('MAX(fulfillment.occurredAt)', 'last')
      .where('fulfillment.prophecyId = :prophecyId', { prophecyId })
      .andWhere('fulfillment.ownerId = :ownerId', { ownerId })
      .getRawOne<{ last: string | Date | null }>();

    const prophecy = await this.prophecies.require(ownerId, prophecyId);
    // Un `MAX(...)` en crudo desde Postgres vuelve como `Date` a medianoche
    // local, así que se convierte con los getters locales (CLAUDE.md).
    prophecy.lastFulfillmentAt = row?.last ? toIsoDay(row.last) : null;
    await this.prophecies.save(prophecy);
  }
}

/** Un cumplimiento no puede ser anterior a la fecha en que se recibió (D7). */
function ensureAfterReception(receivedAt: string, occurredAt: string): void {
  if (occurredAt < receivedAt) {
    throw new BadRequestException('Eso es anterior a la fecha en que la recibiste');
  }
}
