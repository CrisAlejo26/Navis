import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SYSTEM_GIFTS } from '@navis/shared';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { Gift } from './gift.entity';
import { GiftsService } from './gifts.service';

const don = (id: string, name: string, isSystem = false, accent = '#2140cf'): Gift =>
  ({ id, name, accent, churchId: 'c1', position: 0, isSystem, isActive: true }) as Gift;

/**
 * Doble de repositorio en memoria: solo implementa lo que el servicio usa, y
 * por eso lleva la conversión comentada (Regla 10 §2).
 */
function build(existing: Gift[]) {
  const softRemove = vi.fn(() => Promise.resolve());
  const saved: Partial<Gift>[] = [];

  const repo = {
    find: vi.fn(() => Promise.resolve(existing)),
    findOne: vi.fn((options: { where: { id: string } }) =>
      Promise.resolve(existing.find((one) => one.id === options.where.id) ?? null),
    ),
    create: (data: Partial<Gift> | Partial<Gift>[]) => data,
    save: (data: Partial<Gift> | Partial<Gift>[]) => {
      saved.push(...(Array.isArray(data) ? data : [data]));
      return Promise.resolve(data);
    },
    softRemove,
  } as unknown as Repository<Gift>;

  return { service: new GiftsService(repo), softRemove, saved };
}

describe('el catálogo de dones de una iglesia', () => {
  it('siembra los siete de serie en una iglesia que todavía no tiene ninguno', async () => {
    const { service, saved } = build([]);

    await service.ensureFor('c1');

    expect(saved).toHaveLength(SYSTEM_GIFTS.length);
    expect(saved.every((one) => one.isSystem)).toBe(true);
    expect(saved.map((one) => one.name)).toEqual([...SYSTEM_GIFTS]);
  });

  it('no vuelve a sembrar si ya hay catálogo', async () => {
    const { service, saved } = build([don('g1', 'Sanidad', true)]);

    await service.ensureFor('c1');

    expect(saved).toHaveLength(0);
  });

  it('da a cada don nuevo un color libre, para que no nazcan dos iguales', async () => {
    const { service } = build([don('g1', 'Sanidad', true, '#2140cf')]);

    const nuevo = await service.create('c1', { name: 'Interpretación de lenguas' });

    expect(nuevo.accent).not.toBe('#2140cf');
    expect(nuevo.isSystem).toBe(false);
  });

  it('no deja repetir el nombre de un don', async () => {
    const { service } = build([don('g1', 'Sanidad', true)]);

    await expect(service.create('c1', { name: 'sanidad' })).rejects.toThrow(BadRequestException);
  });

  it('un don de serie no se borra: se desactiva', async () => {
    const { service, softRemove } = build([don('g1', 'Sanidad', true)]);

    await expect(service.remove('c1', 'g1')).rejects.toThrow(BadRequestException);
    expect(softRemove).not.toHaveBeenCalled();
  });

  it('uno añadido por la iglesia sí se borra', async () => {
    const { service, softRemove } = build([don('g2', 'Lenguas', false)]);

    await service.remove('c1', 'g2');

    expect(softRemove).toHaveBeenCalledTimes(1);
  });

  it('un don de otra iglesia no existe para quien pregunta', async () => {
    const { service } = build([don('g1', 'Sanidad', true)]);

    await expect(service.require('c1', 'de-otra')).rejects.toThrow(NotFoundException);
  });

  it('no consulta la base de datos si no le piden ningún don', async () => {
    const { service } = build([]);

    expect(await service.requireMany('c1', [])).toEqual([]);
  });
});
