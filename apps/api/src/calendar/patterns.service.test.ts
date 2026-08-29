import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { CongregationsService } from './congregations.service';
import type { MeetingPattern } from './meeting-pattern.entity';
import type { PatternPhase } from './pattern-phase.entity';
import { PatternsService } from './patterns.service';

/**
 * Postgres devuelve la columna `time` con segundos (`20:00:00`), y no
 * `20:00`. Esta fila es la que llegaría de una consulta real, para
 * comprobar que el servicio la normaliza antes de devolverla — sin eso, el
 * `<input type="time">` de la edición no la acepta como valor inicial
 * (RFC 0002 §5.7, ver pattern-form.tsx).
 */
const patron = (extra: Partial<MeetingPattern> = {}): MeetingPattern =>
  ({
    id: 'p1',
    churchId: 'c1',
    calendarId: 'cal1',
    congregationId: 'elda',
    name: 'Culto',
    weekday: 5,
    startTime: '20:00:00',
    accent: 'success',
    isActive: true,
    validFrom: null,
    validTo: null,
    phases: [] as PatternPhase[],
    ...extra,
  }) as MeetingPattern;

function build(existing: MeetingPattern[]) {
  const save = vi.fn((data: Partial<MeetingPattern>) =>
    Promise.resolve({ ...data, id: data.id ?? 'nuevo' }),
  );
  const patterns = {
    // Copias frescas en cada lectura, como haría TypeORM de verdad: si
    // `update` muta el objeto que le llega, no debe tocar `existing`.
    find: vi.fn(() => Promise.resolve(existing.map((one) => ({ ...one })))),
    findOne: vi.fn((options: { where: { id: string } }) => {
      const found = existing.find((one) => one.id === options.where.id);
      return Promise.resolve(found ? { ...found } : null);
    }),
    create: (data: Partial<MeetingPattern>) => data,
    save,
  } as unknown as Repository<MeetingPattern>;

  const phases = {
    delete: vi.fn(() => Promise.resolve()),
    save: vi.fn(() => Promise.resolve()),
    create: (data: Partial<PatternPhase>) => data,
  } as unknown as Repository<PatternPhase>;

  const congregations = {
    require: vi.fn(() => Promise.resolve({ id: 'elda', accent: 'success' })),
  } as unknown as CongregationsService;

  return { service: new PatternsService(patterns, phases, congregations), save };
}

describe('los segundos que devuelve Postgres en `startTime`', () => {
  it('se recortan al listar', async () => {
    const { service } = build([patron()]);

    const [primero] = await service.list('c1', 'cal1');

    expect(primero?.startTime).toBe('20:00');
  });

  it('se recortan al crear', async () => {
    const { service } = build([patron({ id: 'nuevo' })]);

    const creado = await service.create('c1', 'cal1', {
      congregationId: 'elda',
      name: 'Culto',
      weekday: 5,
      startTime: '20:00',
      phases: [{ name: 'Introducción' }],
    });

    expect(creado.startTime).toBe('20:00');
  });

  it('se recortan al editar', async () => {
    // El doble de `save` no persiste: lo que se comprueba es que la
    // relectura final (`require`) pasa por la misma normalización, sea cual
    // sea el cambio pedido.
    const { service } = build([patron()]);

    const editado = await service.update('c1', 'p1', { startTime: '19:30' });

    expect(editado.startTime).toBe('20:00');
    expect(editado.startTime).not.toContain(':00:00');
  });
});
