import { BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';

import type { PropheciesRepository } from './prophecies.repository';
import { PropheciesService, toSearchText } from './prophecies.service';
import type { Prophecy } from './prophecy.entity';

const palabra = (overrides: Partial<Prophecy> = {}): Prophecy =>
  ({
    id: 'p1',
    ownerId: 'u1',
    title: 'La casa',
    body: 'Vi una casa junto al mar',
    searchText: 'la casa vi una casa junto al mar',
    receivedAt: '2026-03-14',
    fulfilledAt: null,
    lastFulfillmentAt: null,
    ...overrides,
  }) as Prophecy;

/**
 * Doble del repositorio: solo implementa lo que el servicio usa, y por eso
 * lleva la conversión comentada (Regla 10 §2).
 *
 * `require` reproduce la regla de D1 —solo devuelve lo del dueño que se pide—
 * porque es justo lo que varios de estos tests comprueban.
 */
function build(existing: Prophecy | null) {
  const softRemove = vi.fn(() => Promise.resolve());
  const saved: Prophecy[] = [];

  const repo = {
    require: (ownerId: string, id: string) => {
      if (!existing || existing.ownerId !== ownerId || existing.id !== id) {
        return Promise.reject(new NotFoundException('Esa profecía no existe'));
      }
      return Promise.resolve(existing);
    },
    requireWithFulfillments: () => Promise.resolve(existing),
    create: (ownerId: string, data: Partial<Prophecy>) => ({ ...data, ownerId }) as Prophecy,
    save: (prophecy: Prophecy) => {
      saved.push(prophecy);
      return Promise.resolve(prophecy);
    },
    softRemove,
  } as unknown as PropheciesRepository;

  return { service: new PropheciesService(repo), saved, softRemove };
}

describe('apuntar una profecía', () => {
  it('guarda el texto de búsqueda normalizado, para que «vision» encuentre «visión»', async () => {
    const { service } = build(null);

    const creada = await service.create('u1', {
      title: 'Visión del río',
      body: 'Había una ribera',
      receivedAt: '2026-03-14',
    });

    expect(creada.searchText).toBe('vision del rio habia una ribera');
  });

  it('rechaza una fecha de cumplimiento anterior a la de recepción', async () => {
    const { service } = build(null);

    await expect(
      service.create('u1', {
        title: 'La casa',
        body: 'Texto',
        receivedAt: '2026-03-14',
        fulfilledAt: '2026-03-01',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('acepta una fecha en el futuro: no es asunto de la aplicación discutirla', async () => {
    const { service } = build(null);

    const creada = await service.create('u1', {
      title: 'La casa',
      body: 'Texto',
      receivedAt: '2030-01-01',
    });

    expect(creada.receivedAt).toBe('2030-01-01');
  });
});

describe('marcar y desmarcar como cumplida', () => {
  it('cerrarla es poner la fecha, y no toca los cumplimientos parciales', async () => {
    const abierta = palabra({ lastFulfillmentAt: '2026-05-02' });
    const { service } = build(abierta);

    const cerrada = await service.update('u1', 'p1', { fulfilledAt: '2026-06-20' });

    expect(cerrada.fulfilledAt).toBe('2026-06-20');
    // Que se fuera cumpliendo a trozos por el camino sigue siendo verdad (D6).
    expect(cerrada.lastFulfillmentAt).toBe('2026-05-02');
  });

  it('reabrirla es quitar la fecha, y tampoco los toca', async () => {
    const cerrada = palabra({ fulfilledAt: '2026-06-20', lastFulfillmentAt: '2026-05-02' });
    const { service } = build(cerrada);

    const abierta = await service.update('u1', 'p1', { fulfilledAt: null });

    expect(abierta.fulfilledAt).toBeNull();
    expect(abierta.lastFulfillmentAt).toBe('2026-05-02');
  });

  it('no deja cerrarla con una fecha anterior a la de recepción', async () => {
    const { service } = build(palabra());

    await expect(service.update('u1', 'p1', { fulfilledAt: '2026-01-01' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rehace el texto de búsqueda al cambiar el título', async () => {
    const { service } = build(palabra());

    const editada = await service.update('u1', 'p1', { title: 'La Casa Nueva' });

    expect(editada.searchText).toBe(toSearchText('La Casa Nueva', editada.body));
  });
});

describe('la barrera del dueño (D1)', () => {
  it('la profecía de otro no existe para quien pregunta', async () => {
    const { service } = build(palabra({ ownerId: 'otro' }));

    await expect(service.update('u1', 'p1', { title: 'Mía' })).rejects.toThrow(NotFoundException);
    await expect(service.remove('u1', 'p1')).rejects.toThrow(NotFoundException);
  });

  it('y tampoco se puede borrar', async () => {
    const { service, softRemove } = build(palabra({ ownerId: 'otro' }));

    await expect(service.remove('u1', 'p1')).rejects.toThrow(NotFoundException);
    expect(softRemove).not.toHaveBeenCalled();
  });
});
