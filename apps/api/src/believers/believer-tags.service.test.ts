import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { BelieverTag } from './believer-tag.entity';
import { BelieverTagsService } from './believer-tags.service';

const tag = (id: string, name: string, accent = '#2140cf'): BelieverTag =>
  ({
    id,
    name,
    accent,
    churchId: 'c1',
    position: 0,
    isSystem: false,
    isActive: true,
  }) as BelieverTag;

/**
 * Doble de repositorio en memoria: solo implementa lo que el servicio usa, y
 * por eso lleva la conversión comentada (Regla 10 §2).
 */
function build(existing: BelieverTag[]) {
  const softRemove = vi.fn(() => Promise.resolve());
  const saved: Partial<BelieverTag>[] = [];

  const repo = {
    find: vi.fn(() => Promise.resolve(existing)),
    findOne: vi.fn((options: { where: { id: string } }) =>
      Promise.resolve(existing.find((one) => one.id === options.where.id) ?? null),
    ),
    create: (data: Partial<BelieverTag> | Partial<BelieverTag>[]) => data,
    save: (data: Partial<BelieverTag> | Partial<BelieverTag>[]) => {
      saved.push(...(Array.isArray(data) ? data : [data]));
      return Promise.resolve(data);
    },
    softRemove,
  } as unknown as Repository<BelieverTag>;

  return { service: new BelieverTagsService(repo), softRemove, saved };
}

describe('el catálogo de etiquetas de creyente de una iglesia', () => {
  it('nace vacío: la iglesia crea las suyas', async () => {
    const { service, saved } = build([]);

    expect(await service.list('c1')).toEqual([]);
    expect(saved).toHaveLength(0);
  });

  it('da a cada etiqueta nueva un color libre, para que no nazcan dos iguales', async () => {
    const { service } = build([tag('t1', 'En busca de trabajo', '#2140cf')]);

    const nuevo = await service.create('c1', { name: 'Voluntario' });

    expect(nuevo.accent).not.toBe('#2140cf');
    expect(nuevo.isSystem).toBe(false);
  });

  it('no deja repetir el nombre de una etiqueta', async () => {
    const { service } = build([tag('t1', 'En busca de trabajo')]);

    await expect(service.create('c1', { name: 'en busca de trabajo' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('una etiqueta de otra iglesia no existe para quien pregunta', async () => {
    const { service } = build([tag('t1', 'En busca de trabajo')]);

    await expect(service.require('c1', 'de-otra')).rejects.toThrow(NotFoundException);
  });

  it('no consulta la base de datos si no le piden ninguna etiqueta', async () => {
    const { service } = build([]);

    expect(await service.requireMany('c1', [])).toEqual([]);
  });

  it('una etiqueta que se borra deja el catálogo sin ella', async () => {
    const { service, softRemove } = build([tag('t1', 'En busca de trabajo')]);

    await service.remove('c1', 't1');

    expect(softRemove).toHaveBeenCalledTimes(1);
  });
});
