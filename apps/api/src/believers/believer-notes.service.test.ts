import { BadRequestException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { BelieverLinksService } from './believer-links.service';
import { BelieverNotesService } from './believer-notes.service';
import type { BelieverNote } from './believer-note.entity';
import { Believer } from './believer.entity';
import type { GiftsService } from './gifts.service';

interface Mundo {
  /** Lo que devolvería `MAX(occurred_at)` en cada llamada, en orden. */
  maximos: (string | null)[];
}

/**
 * Dobles en memoria: solo implementan lo que el servicio usa, y por eso llevan
 * la conversión comentada (Regla 10 §2). Lo que se comprueba es el
 * comportamiento —qué queda en `last_note_at` y qué don se añade—, no cómo lo
 * hace TypeORM por dentro (Regla 4 §4).
 */
function build(mundo: Mundo) {
  const actualizados: { id: string; lastNoteAt: string | null }[] = [];
  const donesAnadidos: { believerId: string; giftId: string }[] = [];
  const guardadas: Partial<BelieverNote>[] = [];
  let leidos = 0;

  const notesRepo = {
    createQueryBuilder: () => ({
      select: () => ({
        where: () => ({
          getRawOne: () => Promise.resolve({ last: mundo.maximos[leidos++] ?? null }),
        }),
      }),
    }),
    findOne: vi.fn(() =>
      // Doble a mano: solo lleva lo que el servicio toca (Regla 10 §2).
      Promise.resolve({
        id: 'n1',
        believerId: 'b1',
        kind: 'don',
        giftId: 'g1',
        occurredAt: '2026-07-14',
        told: 'texto',
        advice: null,
        remindAt: null,
        remindText: null,
        remindDoneAt: null,
      } as unknown as BelieverNote),
    ),
  } as unknown as Repository<BelieverNote>;

  const manager = {
    create: (_entity: unknown, data: Partial<BelieverNote>) => data,
    save: (data: Partial<BelieverNote>) => {
      guardadas.push(data);
      return Promise.resolve({ ...data, id: 'nueva' });
    },
    softRemove: (data: unknown) => Promise.resolve(data),
    getRepository: (entity: unknown) =>
      entity === Believer
        ? {
            update: (id: string, patch: { lastNoteAt: string | null }) => {
              actualizados.push({ id, lastNoteAt: patch.lastNoteAt });
              return Promise.resolve();
            },
          }
        : notesRepo,
  } as unknown as EntityManager;

  const dataSource = {
    transaction: (fn: (m: EntityManager) => Promise<unknown>) => fn(manager),
  } as unknown as DataSource;

  const gifts = {
    require: vi.fn((_churchId: string, id: string) => Promise.resolve({ id })),
  } as unknown as GiftsService;

  const links = {
    addGift: vi.fn((believerId: string, giftId: string) => {
      donesAnadidos.push({ believerId, giftId });
      return Promise.resolve();
    }),
  } as unknown as BelieverLinksService;

  return {
    service: new BelieverNotesService(notesRepo, dataSource, gifts, links),
    actualizados,
    donesAnadidos,
    guardadas,
  };
}

const nota = {
  kind: 'seguimiento' as const,
  occurredAt: '2026-07-14',
  told: 'Hablamos después del culto',
};

describe('escribir en la bitácora', () => {
  it('deja en last_note_at el día de la nota más reciente al crear', async () => {
    const { service, actualizados } = build({ maximos: ['2026-07-14'] });

    await service.create('c1', 'b1', nota, 'u1');

    expect(actualizados).toEqual([{ id: 'b1', lastNoteAt: '2026-07-14' }]);
  });

  it('recalcula al mover la fecha de una nota', async () => {
    const { service, actualizados } = build({ maximos: ['2026-08-01'] });

    await service.update('c1', 'b1', 'n1', { occurredAt: '2026-08-01', kind: 'seguimiento' });

    expect(actualizados).toEqual([{ id: 'b1', lastNoteAt: '2026-08-01' }]);
  });

  it('deja last_note_at en nulo al borrar la única nota', async () => {
    const { service, actualizados } = build({ maximos: [null] });

    await service.remove('b1', 'n1');

    expect(actualizados).toEqual([{ id: 'b1', lastNoteAt: null }]);
  });

  it('borrar la nota de un don NO le quita el don', async () => {
    const { service, donesAnadidos } = build({ maximos: [null] });

    await service.remove('b1', 'n1');

    // No se toca la tabla puente: recibirlo pasó, y borrar el apunte de cuándo
    // pasó no es dejar de tenerlo (§6.3).
    expect(donesAnadidos).toEqual([]);
  });

  it('una nota de tipo don se lo añade a la ficha', async () => {
    const { service, donesAnadidos } = build({ maximos: ['2026-07-14'] });

    await service.create('c1', 'b1', { ...nota, kind: 'don', giftId: 'g7' }, 'u1');

    expect(donesAnadidos).toEqual([{ believerId: 'b1', giftId: 'g7' }]);
  });

  it('una nota de tipo don sin don elegido no se guarda', async () => {
    const { service, guardadas } = build({ maximos: [] });

    await expect(service.create('c1', 'b1', { ...nota, kind: 'don' }, 'u1')).rejects.toThrow(
      BadRequestException,
    );
    expect(guardadas).toEqual([]);
  });

  it('una nota que deja de ser de tipo don se queda sin don', async () => {
    const { service, guardadas } = build({ maximos: ['2026-07-14'] });

    await service.update('c1', 'b1', 'n1', { kind: 'testimonio' });

    expect(guardadas[0]?.giftId).toBeNull();
  });
});

describe('el recordatorio de una nota', () => {
  it('guarda día y hora, no solo el día', async () => {
    const { service, guardadas } = build({ maximos: ['2026-07-14'] });

    await service.create(
      'c1',
      'b1',
      { ...nota, remindAt: '2026-08-12T19:00', remindText: 'Preguntarle por su madre' },
      'u1',
    );

    expect(guardadas[0]?.remindAt?.getHours()).toBe(19);
    expect(guardadas[0]?.remindText).toBe('Preguntarle por su madre');
    // Nace pendiente: nadie lo ha atendido todavía.
    expect(guardadas[0]?.remindDoneAt).toBeUndefined();
  });

  it('darlo por atendido le pone la fecha en que se hizo', async () => {
    const { service, guardadas } = build({ maximos: ['2026-07-14'] });

    await service.update('c1', 'b1', 'n1', {
      remindAt: '2026-08-12T19:00',
      remindDone: true,
      kind: 'seguimiento',
    });

    expect(guardadas[0]?.remindDoneAt).toBeInstanceOf(Date);
  });

  it('quitar el recordatorio lo deja también sin marca de atendido', async () => {
    const { service, guardadas } = build({ maximos: ['2026-07-14'] });

    // Si mañana se pone otro, empieza pendiente y no heredando el de antes.
    await service.update('c1', 'b1', 'n1', {
      remindAt: null,
      remindDone: true,
      kind: 'seguimiento',
    });

    expect(guardadas[0]?.remindAt).toBeNull();
    expect(guardadas[0]?.remindDoneAt).toBeNull();
  });
});
