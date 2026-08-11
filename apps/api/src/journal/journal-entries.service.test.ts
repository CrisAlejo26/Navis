import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import { JournalEntriesService } from './journal-entries.service';
import type { JournalEntry } from './journal-entry.entity';

const entrada = (overrides: Partial<JournalEntry> = {}): JournalEntry =>
  ({
    id: 'e1',
    churchId: 'c1',
    title: 'Visita a la familia Gómez',
    kind: 'testimonio',
    occurredAt: '2026-07-14',
    annotation: 'Contó que...',
    learned: null,
    searchText: 'visita a la familia gomez contó que...',
    remindAt: null,
    remindText: null,
    remindDoneAt: null,
    authorId: 'u1',
    ...overrides,
  }) as unknown as JournalEntry;

/**
 * Doble en memoria: solo implementa lo que el servicio usa (Regla 10 §2). Lo
 * que se comprueba es qué queda guardado, no cómo lo hace TypeORM por dentro
 * (Regla 4 §4).
 */
function build(existente: JournalEntry = entrada()) {
  const guardadas: Partial<JournalEntry>[] = [];
  // Sueltos y no como propiedades de `repo`: referenciar un método tipado por
  // `Repository<JournalEntry>` en una aserción dispara `unbound-method`.
  const softRemove = vi.fn((data: unknown) => Promise.resolve(data));

  const repo = {
    create: (data: Partial<JournalEntry>) => data,
    save: (data: Partial<JournalEntry>) => {
      guardadas.push(data);
      return Promise.resolve({ ...existente, ...data });
    },
    findOne: vi.fn(({ where }: { where: { id: string; churchId: string } }) =>
      Promise.resolve(
        where.id === existente.id && where.churchId === existente.churchId ? existente : null,
      ),
    ),
    softRemove,
  } as unknown as Repository<JournalEntry>;

  return { service: new JournalEntriesService(repo), guardadas, softRemove };
}

const base = {
  title: 'Visita a la familia Gómez',
  kind: 'testimonio' as const,
  occurredAt: '2026-07-14',
  annotation: 'Contó que...',
};

describe('escribir en el cuaderno', () => {
  it('normaliza título, anotación y lo aprendido en search_text', async () => {
    const { service, guardadas } = build();

    await service.create('c1', { ...base, learned: 'Que a veces empieza por una llamada' }, 'u1');

    expect(guardadas[0]?.searchText).toContain('gomez');
    expect(guardadas[0]?.searchText).toContain('llamada');
  });

  it('una entrada de otra iglesia no se encuentra', async () => {
    const { service } = build();

    await expect(service.update('otra-iglesia', 'e1', { title: 'x' })).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('el recordatorio de una entrada', () => {
  it('guarda día y hora, no solo el día', async () => {
    const { service, guardadas } = build();

    await service.create(
      'c1',
      { ...base, remindAt: '2026-08-12T19:00', remindText: 'Preguntar cómo sigue' },
      'u1',
    );

    expect(guardadas[0]?.remindAt?.getHours()).toBe(19);
    expect(guardadas[0]?.remindText).toBe('Preguntar cómo sigue');
    // Nace pendiente: nadie lo ha atendido todavía.
    expect(guardadas[0]?.remindDoneAt).toBeUndefined();
  });

  it('un recordatorio con mensaje pero sin fecha se rechaza', async () => {
    const { service, guardadas } = build();

    await expect(
      service.create('c1', { ...base, remindText: 'Preguntar cómo sigue' }, 'u1'),
    ).rejects.toThrow(BadRequestException);
    expect(guardadas).toEqual([]);
  });

  it('darlo por atendido le pone la fecha en que se hizo', async () => {
    const { service, guardadas } = build(
      entrada({ remindAt: new Date('2026-08-12T19:00:00.000Z') }),
    );

    await service.update('c1', 'e1', { remindDone: true });

    expect(guardadas[0]?.remindDoneAt).toBeInstanceOf(Date);
  });

  it('darlo por atendido NO borra la entrada', async () => {
    const { service, softRemove } = build(
      entrada({ remindAt: new Date('2026-08-12T19:00:00.000Z') }),
    );

    await service.update('c1', 'e1', { remindDone: true });

    expect(softRemove).not.toHaveBeenCalled();
  });

  it('quitar el recordatorio lo deja también sin marca de atendido', async () => {
    const { service, guardadas } = build(
      entrada({
        remindAt: new Date('2026-08-12T19:00:00.000Z'),
        remindDoneAt: new Date('2026-08-13T00:00:00.000Z'),
      }),
    );

    // Si mañana se pone otro, empieza pendiente y no heredando el de antes.
    await service.update('c1', 'e1', { remindAt: null });

    expect(guardadas[0]?.remindAt).toBeNull();
    expect(guardadas[0]?.remindDoneAt).toBeNull();
  });
});
