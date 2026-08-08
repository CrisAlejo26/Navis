import { Injectable } from '@nestjs/common';
import {
  addDays,
  DASHBOARD_EVENTS_PREVIEW,
  DASHBOARD_EVENTS_WINDOW_DAYS,
  type DashboardEvent,
  type IsoDate,
} from '@navis/shared';

import { ScheduleService } from '../calendar/schedule.service';
import { WeekSeederService } from '../calendar/week-seeder.service';

/**
 * Los próximos eventos de la portada: los cinco siguientes del calendario de
 * púlpito (RFC 0001).
 *
 * Es a propósito el de púlpito y no «todos los calendarios a la vez»: sonido,
 * recepción y biblias son programaciones de apoyo a ese mismo servicio, y
 * mezclarlas en una sola lista respondería a una pregunta que nadie hace en la
 * portada. Quien programa esos calendarios ya tiene su propia pantalla.
 */
@Injectable()
export class DashboardEventsService {
  constructor(
    private readonly week: WeekSeederService,
    private readonly schedule: ScheduleService,
  ) {}

  async upcoming(churchId: string, today: IsoDate): Promise<DashboardEvent[]> {
    // Con `ensureScaffold` y no `calendars.ensureFor` a secas: el panel de
    // inicio puede ser la primera pantalla que ve una iglesia recién creada,
    // y sin la semana de serie sembrada aquí no habría nada que proponer.
    const { calendars: all } = await this.week.ensureScaffold(churchId);
    const calendar = all.find((one) => one.slug === 'pulpito') ?? all[0];
    if (!calendar) return [];

    const range = await this.schedule.range(churchId, {
      calendarId: calendar.id,
      from: today,
      to: addDays(today, DASHBOARD_EVENTS_WINDOW_DAYS),
    });

    const congregationName = new Map(range.congregations.map((one) => [one.id, one.name]));
    const events: DashboardEvent[] = [];

    for (const day of range.days) {
      for (const meeting of day.meetings) {
        if (meeting.status === 'cancelada') continue;

        events.push({
          meetingId: meeting.id,
          date: day.date,
          startTime: meeting.startTime,
          name: meeting.name,
          congregationName: congregationName.get(meeting.congregationId) ?? '—',
          accent: meeting.accent,
        });

        if (events.length >= DASHBOARD_EVENTS_PREVIEW) return events;
      }
    }

    return events;
  }
}
