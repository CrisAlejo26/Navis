import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { QueryFailedError } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { Church } from '../churches/church.entity';
import type { Congregation } from './congregation.entity';
import { CongregationsService } from './congregations.service';

/** El choque que dos peticiones sembrando la sede de serie a la vez dejarían. */
const CHOQUE_UNICO = new QueryFailedError('INSERT ...', [], { code: '23505' } as unknown as Error);

const sede = (id: string, name: string, accent = 'primary'): Congregation =>
  ({
    id,
    name,
    accent,
    churchId: 'c1',
    position: 0,
    isDefault: false,
    isActive: true,
  }) as Congregation;

function build(existing: Congregation[]) {
  const softRemove = vi.fn(() => Promise.resolve());

  const repo = {
    find: vi.fn(() => Promise.resolve(existing)),
    findOne: vi.fn((options: { where: { id: string } }) =>
      Promise.resolve(existing.find((one) => one.id === options.where.id) ?? null),
    ),
    create: (data: Partial<Congregation>) => data,
    save: (data: Partial<Congregation>) => Promise.resolve({ ...data, id: data.id ?? 'nueva' }),
    softRemove,
  } as unknown as Repository<Congregation>;

  const churchRepo = {
    findOne: vi.fn(() => Promise.resolve({ id: 'c1', name: 'Iglesia Central' })),
  } as unknown as Repository<Church>;

  return { service: new CongregationsService(repo, churchRepo), softRemove };
}

describe('las sedes de una iglesia', () => {
  it('da a cada sede nueva un color libre, para que no nazcan dos iguales', async () => {
    const { service } = build([sede('s1', 'Benidorm', 'primary')]);

    const nueva = await service.create('c1', { name: 'Elda' });

    expect(nueva.accent).not.toBe('primary');
    expect(nueva.position).toBe(1);
  });

  it('la primera sede queda marcada por defecto', async () => {
    const { service } = build([]);

    expect((await service.create('c1', { name: 'Benidorm' })).isDefault).toBe(true);
  });

  it('no deja repetir el nombre de una sede', async () => {
    const { service } = build([sede('s1', 'Elda')]);

    await expect(service.create('c1', { name: 'elda' })).rejects.toThrow(BadRequestException);
  });

  it('no borra la única sede: la iglesia se quedaría sin poder programar', async () => {
    const { service, softRemove } = build([sede('s1', 'Elda')]);

    await expect(service.remove('c1', 's1')).rejects.toThrow(BadRequestException);
    expect(softRemove).not.toHaveBeenCalled();
  });

  it('borra una sede cuando hay más de una', async () => {
    const { service, softRemove } = build([sede('s1', 'Elda'), sede('s2', 'Alicante')]);

    await service.remove('c1', 's1');
    expect(softRemove).toHaveBeenCalledTimes(1);
  });

  it('una sede de otra iglesia no existe para quien pregunta', async () => {
    const { service } = build([sede('s1', 'Elda')]);

    await expect(service.require('c1', 'de-otra')).rejects.toThrow(NotFoundException);
  });

  // El fallo real: la primera carga de una iglesia recién creada dispara
  // varias pantallas de golpe, y más de una puede ver «ninguna sede» a la vez
  // e intentar sembrar la de serie.
  describe('ensureFor', () => {
    it('siembra la sede de serie si la iglesia no tiene ninguna', async () => {
      const sembrada = [sede('s1', 'Iglesia Central', 'primary')];
      const find = vi.fn().mockResolvedValueOnce([]).mockResolvedValue(sembrada);
      const repo = {
        find,
        create: (data: Partial<Congregation>) => data,
        save: vi.fn(() => Promise.resolve(sembrada[0])),
      } as unknown as Repository<Congregation>;
      const churchRepo = {
        findOne: vi.fn(() => Promise.resolve({ id: 'c1', name: 'Iglesia Central' })),
      } as unknown as Repository<Church>;
      const service = new CongregationsService(repo, churchRepo);

      const sedes = await service.ensureFor('c1');

      expect(sedes.map((one) => one.name)).toEqual(['Iglesia Central']);
    });

    it('no siembra si ya hay alguna', async () => {
      const save = vi.fn();
      const repo = {
        find: vi.fn(() => Promise.resolve([sede('s1', 'Elda')])),
        save,
      } as unknown as Repository<Congregation>;
      const churchRepo = { findOne: vi.fn() } as unknown as Repository<Church>;
      const service = new CongregationsService(repo, churchRepo);

      await service.ensureFor('c1');

      expect(save).not.toHaveBeenCalled();
    });

    it('si pierde la carrera contra otra siembra, no falla: relee y devuelve lo que ya hay', async () => {
      const sembrada = [sede('s1', 'Iglesia Central', 'primary')];
      const find = vi.fn().mockResolvedValueOnce([]).mockResolvedValue(sembrada);
      const repo = {
        find,
        create: (data: Partial<Congregation>) => data,
        save: vi.fn(() => Promise.reject(CHOQUE_UNICO)),
      } as unknown as Repository<Congregation>;
      const churchRepo = {
        findOne: vi.fn(() => Promise.resolve({ id: 'c1', name: 'Iglesia Central' })),
      } as unknown as Repository<Church>;
      const service = new CongregationsService(repo, churchRepo);

      await expect(service.ensureFor('c1')).resolves.toEqual(sembrada);
      expect(find).toHaveBeenCalledTimes(2);
    });

    it('un error de consulta que no es un choque de únicos sí revienta', async () => {
      const repo = {
        find: vi.fn(() => Promise.resolve([])),
        create: (data: Partial<Congregation>) => data,
        save: vi.fn(() => Promise.reject(new Error('la base de datos está caída'))),
      } as unknown as Repository<Congregation>;
      const churchRepo = {
        findOne: vi.fn(() => Promise.resolve(null)),
      } as unknown as Repository<Church>;
      const service = new CongregationsService(repo, churchRepo);

      await expect(service.ensureFor('c1')).rejects.toThrow('la base de datos está caída');
    });
  });
});
