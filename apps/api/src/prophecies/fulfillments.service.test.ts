import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { FulfillmentsService } from './fulfillments.service';
import type { PropheciesRepository } from './prophecies.repository';
import type { ProphecyFulfillment } from './prophecy-fulfillment.entity';
import type { Prophecy } from './prophecy.entity';

const cumplimiento = (overrides: Partial<ProphecyFulfillment> = {}): ProphecyFulfillment =>
  ({
    id: 'f1',
    prophecyId: 'p1',
    ownerId: 'u1',
    text: 'Se cumplió la parte del viaje',
    occurredAt: '2026-05-02',
    ...overrides,
  }) as ProphecyFulfillment;

/**
 * Dobles en memoria del repositorio de cumplimientos y del de profecías.
 *
 * `max` es lo que devolvería el `MAX(occurred_at)`: el test lo fija para poder
 * comprobar que el servicio escribe exactamente eso en `last_fulfillment_at`.
 */
function build(
  options: { max?: string | Date | null; existing?: ProphecyFulfillment | null } = {},
) {
  const prophecy = {
    id: 'p1',
    ownerId: 'u1',
    receivedAt: '2026-03-14',
    lastFulfillmentAt: null,
  } as Prophecy;

  const softRemove = vi.fn(() => Promise.resolve());
  const existing = options.existing === undefined ? cumplimiento() : options.existing;

  const fulfillments = {
    findOne: (query: { where: { id: string; prophecyId: string; ownerId: string } }) =>
      Promise.resolve(
        existing && existing.id === query.where.id && existing.ownerId === query.where.ownerId
          ? existing
          : null,
      ),
    create: (data: Partial<ProphecyFulfillment>) => data as ProphecyFulfillment,
    save: (data: ProphecyFulfillment) => Promise.resolve(data),
    softRemove,
    createQueryBuilder: () => ({
      select: () => ({
        where: () => ({
          andWhere: () => ({
            getRawOne: () => Promise.resolve({ last: options.max ?? null }),
          }),
        }),
      }),
    }),
  } as unknown as Repository<ProphecyFulfillment>;

  const prophecies = {
    require: (ownerId: string) =>
      ownerId === prophecy.ownerId
        ? Promise.resolve(prophecy)
        : Promise.reject(new NotFoundException('Esa profecía no existe')),
    save: (one: Prophecy) => Promise.resolve(one),
  } as unknown as PropheciesRepository;

  return { service: new FulfillmentsService(fulfillments, prophecies), prophecy, softRemove };
}

describe('el último movimiento de una profecía', () => {
  it('se recalcula al anotar un cumplimiento', async () => {
    const { service, prophecy } = build({ max: '2026-05-02' });

    await service.create('u1', 'p1', { text: 'El viaje', occurredAt: '2026-05-02' });

    expect(prophecy.lastFulfillmentAt).toBe('2026-05-02');
  });

  it('se recalcula al mover la fecha de uno que ya estaba', async () => {
    const { service, prophecy } = build({ max: '2026-07-30' });

    await service.update('u1', 'p1', 'f1', { occurredAt: '2026-07-30' });

    expect(prophecy.lastFulfillmentAt).toBe('2026-07-30');
  });

  it('vuelve a nulo cuando se borra el último que quedaba', async () => {
    const { service, prophecy, softRemove } = build({ max: null });

    await service.remove('u1', 'p1', 'f1');

    expect(softRemove).toHaveBeenCalledTimes(1);
    expect(prophecy.lastFulfillmentAt).toBeNull();
  });

  it('convierte con los getters locales lo que Postgres devuelve como Date', async () => {
    // El driver construye la fecha a medianoche local: por ISO saldría el día
    // anterior en cualquier huso al este de Greenwich (CLAUDE.md).
    const { service, prophecy } = build({ max: new Date(2026, 7, 1) });

    await service.create('u1', 'p1', { text: 'Parte', occurredAt: '2026-08-01' });

    expect(prophecy.lastFulfillmentAt).toBe('2026-08-01');
  });
});

describe('las fechas de un cumplimiento', () => {
  it('no puede ser anterior a la fecha en que se recibió la profecía', async () => {
    const { service } = build({});

    await expect(
      service.create('u1', 'p1', { text: 'Parte', occurredAt: '2026-01-01' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('tampoco al editarlo', async () => {
    const { service } = build({});

    await expect(service.update('u1', 'p1', 'f1', { occurredAt: '2026-01-01' })).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('la barrera del dueño en la tabla hija (D1)', () => {
  it('el cumplimiento de otro no existe para quien pregunta', async () => {
    const { service } = build({ existing: cumplimiento({ ownerId: 'otro' }) });

    await expect(service.remove('u1', 'p1', 'f1')).rejects.toThrow(NotFoundException);
  });

  it('y la profecía de otro tampoco deja anotar en ella', async () => {
    const { service } = build({});

    await expect(
      service.create('otro', 'p1', { text: 'Parte', occurredAt: '2026-05-02' }),
    ).rejects.toThrow(NotFoundException);
  });
});
