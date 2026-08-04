import { DEFAULT_WEEK } from '@navis/shared';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { Congregation } from './congregation.entity';
import type { MeetingPattern } from './meeting-pattern.entity';
import type { PatternPhase } from './pattern-phase.entity';
import { WeekSeederService } from './week-seeder.service';

function build({ yaTiene = false, sedes = [{ id: 'elda', accent: 'success' }] } = {}) {
  const guardados: Partial<MeetingPattern>[] = [];
  const fases: Partial<PatternPhase>[][] = [];

  const patterns = {
    exists: vi.fn(() => Promise.resolve(yaTiene)),
    create: (data: Partial<MeetingPattern>) => data,
    save: (data: Partial<MeetingPattern>) => {
      guardados.push(data);
      return Promise.resolve({ ...data, id: `p${String(guardados.length)}` });
    },
  } as unknown as Repository<MeetingPattern>;

  const phases = {
    create: (data: Partial<PatternPhase>) => data,
    save: (data: Partial<PatternPhase>[]) => {
      fases.push(data);
      return Promise.resolve(data);
    },
  } as unknown as Repository<PatternPhase>;

  const congregations = {
    find: vi.fn(() => Promise.resolve(sedes)),
    findOne: vi.fn(() => Promise.resolve(sedes[0])),
  } as unknown as Repository<Congregation>;

  return { service: new WeekSeederService(patterns, phases, congregations), guardados, fases };
}

describe('la semana de serie', () => {
  it('siembra las siete reuniones con su día, su hora y sus fases', async () => {
    const { service, guardados, fases } = build();

    await service.seed('c1', 'cal', 'elda');

    expect(guardados).toHaveLength(7);
    expect(guardados.map((one) => [one.weekday, one.name, one.startTime])).toEqual([
      [1, 'Alabanza', '19:00'],
      [2, 'Estudio bíblico', '19:00'],
      [3, 'Enseñanza', '19:00'],
      [4, 'Alabanza', '19:00'],
      [5, 'Alabanza', '19:00'],
      [6, 'Estudio bíblico', '18:00'],
      [0, 'Enseñanza', '10:00'],
    ]);

    // El miércoles y el domingo son de enseñanza: predicación y testimonios,
    // sin cierre.
    expect(fases[2]?.map((phase) => phase.name)).toEqual([
      'Introducción',
      'Predicación',
      'Testimonios',
    ]);
    expect(fases[6]?.map((phase) => phase.name)).toEqual(fases[2]?.map((phase) => phase.name));
    expect(fases[0]?.map((phase) => phase.name)).toEqual(['Introducción', 'Final']);
  });

  it('no vuelve a sembrar donde ya hay algo: la semana ajustada no se pisa', async () => {
    const { service, guardados } = build({ yaTiene: true });

    await service.seed('c1', 'cal', 'elda');

    expect(guardados).toEqual([]);
  });

  it('un calendario nuevo nace con su semana en cada sede activa', async () => {
    const { service, guardados } = build({
      sedes: [
        { id: 'elda', accent: 'success' },
        { id: 'alicante', accent: 'accent' },
      ],
    });

    await service.seedCalendar('c1', 'cal');

    expect(guardados).toHaveLength(DEFAULT_WEEK.length * 2);
    expect(new Set(guardados.map((one) => one.congregationId))).toEqual(
      new Set(['elda', 'alicante']),
    );
  });
});
