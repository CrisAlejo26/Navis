import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { describe, expect, it, vi } from 'vitest';

import type { BelieversRosterService } from '../believers/believers-roster.service';
import { ScheduleService } from './schedule.service';
import type { Congregation } from './congregation.entity';
import type { CongregationsService } from './congregations.service';
import type { MeetingPattern } from './meeting-pattern.entity';
import type { Meeting } from './meeting.entity';
import type { PatternsService } from './patterns.service';

const ELDA = { id: 'elda', name: 'Elda', accent: 'success', position: 0, isActive: true };

const patron = (extra: Partial<MeetingPattern> = {}): MeetingPattern =>
  ({
    id: 'p1',
    congregationId: ELDA.id,
    name: 'Culto',
    weekday: 5, // viernes
    startTime: '20:00:00',
    accent: 'success',
    isActive: true,
    validFrom: null,
    validTo: null,
    phases: [
      { id: 'f1', name: 'Introducción', position: 0 },
      { id: 'f2', name: 'Enseñanza', position: 1 },
    ],
    ...extra,
  }) as MeetingPattern;

function build({ patterns = [patron()], meetings = [] as Meeting[] } = {}) {
  const congregations = {
    ensureFor: vi.fn(() => Promise.resolve([ELDA as Congregation])),
  } as unknown as CongregationsService;

  const patternsService = {
    activeFor: vi.fn(() => Promise.resolve(patterns)),
  } as unknown as PatternsService;

  const believers = {
    namesOf: vi.fn(() => Promise.resolve(new Map([['b1', 'Luis Fernando']]))),
  } as unknown as BelieversRosterService;

  const repo = {
    find: vi.fn(() => Promise.resolve(meetings)),
  } as unknown as Repository<Meeting>;

  return new ScheduleService(repo, congregations, patternsService, believers);
}

describe('el calendario de un tramo', () => {
  it('propone la reunión del patrón en cada día de la semana que le toca, sin crear filas', async () => {
    const rango = await build().range('c1', {
      calendarId: 'cal',
      from: '2026-08-01',
      to: '2026-08-31',
    });

    const conReunion = rango.days.filter((day) => day.meetings.length > 0);
    expect(conReunion.map((day) => day.date)).toEqual([
      '2026-08-07',
      '2026-08-14',
      '2026-08-21',
      '2026-08-28',
    ]);

    const primera = conReunion[0]?.meetings[0];
    expect(primera).toMatchObject({ id: null, patternId: 'p1', startTime: '20:00' });
    expect(primera?.slots.map((slot) => slot.name)).toEqual(['Introducción', 'Enseñanza']);
  });

  it('respeta la vigencia del patrón', async () => {
    const servicio = build({
      patterns: [patron({ validFrom: '2026-08-14', validTo: '2026-08-21' })],
    });
    const rango = await servicio.range('c1', {
      calendarId: 'cal',
      from: '2026-08-01',
      to: '2026-08-31',
    });

    expect(rango.days.filter((day) => day.meetings.length > 0).map((day) => day.date)).toEqual([
      '2026-08-14',
      '2026-08-21',
    ]);
  });

  it('la reunión materializada sustituye a la propuesta de ese día', async () => {
    const materializada = {
      id: 'm1',
      congregationId: ELDA.id,
      patternId: 'p1',
      date: '2026-08-07',
      startTime: '19:30:00',
      name: 'Culto',
      accent: 'success',
      status: 'programada',
      notes: null,
      slots: [{ id: 's1', name: 'Introducción', position: 0, believerId: 'b1', note: null }],
    } as unknown as Meeting;

    const rango = await build({ meetings: [materializada] }).range('c1', {
      calendarId: 'cal',
      from: '2026-08-01',
      to: '2026-08-08',
    });

    const dia = rango.days.find((day) => day.date === '2026-08-07');
    expect(dia?.meetings).toHaveLength(1);
    expect(dia?.meetings[0]).toMatchObject({ id: 'm1', startTime: '19:30' });
    expect(dia?.meetings[0]?.slots[0]?.believer).toEqual({ id: 'b1', name: 'Luis Fernando' });
  });

  it('rechaza un rango del revés o más largo de lo permitido', async () => {
    const servicio = build();

    await expect(
      servicio.range('c1', { calendarId: 'cal', from: '2026-08-31', to: '2026-08-01' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      servicio.range('c1', { calendarId: 'cal', from: '2026-01-01', to: '2026-12-31' }),
    ).rejects.toThrow(BadRequestException);
  });
});
