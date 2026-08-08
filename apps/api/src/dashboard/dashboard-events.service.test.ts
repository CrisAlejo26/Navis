import type { Calendar } from '../calendar/calendar.entity';
import type { CalendarsService } from '../calendar/calendars.service';
import type { ScheduleService } from '../calendar/schedule.service';
import { describe, expect, it, vi } from 'vitest';

import { DashboardEventsService } from './dashboard-events.service';

const calendario = (slug: string): Calendar => ({ id: `id-${slug}`, slug }) as Calendar;

function build(calendars: Calendar[], result: unknown) {
  const range = vi.fn(() => Promise.resolve(result));

  const calendarsService = {
    ensureFor: vi.fn(() => Promise.resolve(calendars)),
  } as unknown as CalendarsService;

  const scheduleService = { range } as unknown as ScheduleService;

  return { service: new DashboardEventsService(calendarsService, scheduleService), range };
}

describe('los próximos eventos de la portada', () => {
  it('pide el calendario de púlpito y no otro, aunque no sea el primero', async () => {
    const { service, range } = build([calendario('sonido'), calendario('pulpito')], {
      congregations: [],
      days: [],
    });

    await service.upcoming('c1', '2026-08-05');

    expect(range).toHaveBeenCalledWith('c1', expect.objectContaining({ calendarId: 'id-pulpito' }));
  });

  it('se queda con el primero si la iglesia no tiene calendario de púlpito', async () => {
    const { service, range } = build([calendario('recepcion')], { congregations: [], days: [] });

    await service.upcoming('c1', '2026-08-05');

    expect(range).toHaveBeenCalledWith(
      'c1',
      expect.objectContaining({ calendarId: 'id-recepcion' }),
    );
  });

  it('salta las reuniones canceladas y para en las cinco siguientes', async () => {
    const días = [
      {
        date: '2026-08-06',
        meetings: [
          { id: 'm1', status: 'cancelada', congregationId: 'sede1', startTime: '18:00' },
          { id: 'm2', status: 'programada', congregationId: 'sede1', startTime: '19:00' },
        ],
      },
      {
        date: '2026-08-09',
        meetings: Array.from({ length: 5 }, (_unused, index) => ({
          id: `s${String(index)}`,
          status: 'programada',
          congregationId: 'sede1',
          startTime: '10:00',
          name: 'Culto',
          accent: 'primary',
        })),
      },
    ];

    const { service } = build([calendario('pulpito')], {
      congregations: [{ id: 'sede1', name: 'Central' }],
      days: días,
    });

    const eventos = await service.upcoming('c1', '2026-08-05');

    expect(eventos).toHaveLength(5);
    expect(eventos[0]).toMatchObject({ meetingId: 'm2', congregationName: 'Central' });
  });

  it('no revienta si la iglesia todavía no tiene ningún calendario', async () => {
    const { service } = build([], { congregations: [], days: [] });

    await expect(service.upcoming('c1', '2026-08-05')).resolves.toEqual([]);
  });
});
