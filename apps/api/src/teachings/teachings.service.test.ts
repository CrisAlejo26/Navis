import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { TeachingBody } from '@navis/shared';
import { describe, expect, it, vi } from 'vitest';

import { toSearchText, TeachingsService } from './teachings.service';
import type { TeachingsRepository } from './teachings.repository';
import type { Teaching } from './teaching.entity';

const parrafo = (texto: string): TeachingBody['content'][number] => ({
  type: 'paragraph',
  content: [{ type: 'text', text: texto }],
});

const cuerpo = (texto: string): TeachingBody => ({ type: 'doc', content: [parrafo(texto)] });

const enseñanza = (overrides: Partial<Teaching> = {}): Teaching =>
  ({
    id: 't1',
    ownerId: 'u1',
    title: 'Sobre la paciencia',
    bodyJson: JSON.stringify(cuerpo('Lo que aprendí')),
    searchText: 'sobre la paciencia lo que aprendi',
    receivedAt: '2026-03-14',
    ...overrides,
  }) as Teaching;

/** Doble del repositorio, calcado del de `prophecies.service.test.ts` (Regla 4 §4). */
function build(existing: Teaching | null) {
  const softRemove = vi.fn(() => Promise.resolve());
  const saved: Teaching[] = [];

  const repo = {
    require: (ownerId: string, id: string) => {
      if (!existing || existing.ownerId !== ownerId || existing.id !== id) {
        return Promise.reject(new NotFoundException('Esa enseñanza no existe'));
      }
      return Promise.resolve(existing);
    },
    create: (ownerId: string, data: Partial<Teaching>) => ({ ...data, ownerId }) as Teaching,
    save: (teaching: Teaching) => {
      saved.push(teaching);
      return Promise.resolve(teaching);
    },
    softRemove,
  } as unknown as TeachingsRepository;

  return { service: new TeachingsService(repo), saved, softRemove };
}

describe('anotar una enseñanza', () => {
  it('guarda el texto de búsqueda normalizado, para que «vision» encuentre «visión»', async () => {
    const { service } = build(null);

    const creada = await service.create('u1', {
      title: 'Visión del río',
      body: cuerpo('Había una ribera'),
      receivedAt: '2026-03-14',
    });

    expect(creada.searchText).toBe('vision del rio habia una ribera');
  });

  it('rechaza un cuerpo que no cumple el whitelist de nodos', async () => {
    const { service } = build(null);

    await expect(
      service.create('u1', {
        title: 'Título',
        // Un tipo de nodo que no existe en el whitelist (§4.2 del RFC).
        body: { type: 'doc', content: [{ type: 'heading' }] },
        receivedAt: '2026-03-14',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('editar una enseñanza', () => {
  it('rehace el texto de búsqueda al cambiar el título', async () => {
    const { service } = build(enseñanza());

    const editada = await service.update('u1', 't1', { title: 'Sobre la paciencia (revisado)' });

    expect(editada.searchText).toBe(
      toSearchText('Sobre la paciencia (revisado)', cuerpo('Lo que aprendí')),
    );
  });
});

describe('la barrera del dueño', () => {
  it('la enseñanza de otro no existe para quien pregunta', async () => {
    const { service } = build(enseñanza({ ownerId: 'otro' }));

    await expect(service.update('u1', 't1', { title: 'Mía' })).rejects.toThrow(NotFoundException);
  });

  it('y tampoco se puede borrar', async () => {
    const { service, softRemove } = build(enseñanza({ ownerId: 'otro' }));

    await expect(service.remove('u1', 't1')).rejects.toThrow(NotFoundException);
    expect(softRemove).not.toHaveBeenCalled();
  });
});
