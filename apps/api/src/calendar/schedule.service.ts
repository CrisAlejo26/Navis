import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  daysBetween,
  eachDay,
  weekdayOf,
  MAX_CALENDAR_RANGE_DAYS,
  type CalendarDay,
  type CalendarRange,
} from '@navis/shared';
import { Between, In, Repository } from 'typeorm';

import { BelieversService } from '../believers/believers.service';
import { byTimeThenCongregation, meetingView, proposedMeeting, toIsoDay } from './calendar-format';
import { CongregationsService } from './congregations.service';
import type { MeetingPattern } from './meeting-pattern.entity';
import { Meeting } from './meeting.entity';
import { PatternsService } from './patterns.service';

export interface RangeQuery {
  /** De qué calendario: púlpito, sonido… (D15). */
  calendarId: string;
  from: string;
  to: string;
  /** Sedes a las que acotar. Vacío o ausente es «todas». */
  congregationIds?: readonly string[];
}

/**
 * La programación de un tramo de **un calendario**: las reuniones que existen y las que **todavía no**
 * —las que propone cada patrón— con la misma forma, para que la interfaz no
 * tenga que distinguirlas más que por un `id` nulo (D3).
 */
@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Meeting) private readonly meetings: Repository<Meeting>,
    private readonly congregations: CongregationsService,
    private readonly patterns: PatternsService,
    private readonly believers: BelieversService,
  ) {}

  async range(churchId: string, query: RangeQuery): Promise<CalendarRange> {
    const { from, to } = checkRange(query);
    const only = query.congregationIds?.length ? new Set(query.congregationIds) : null;

    const congregations = await this.congregations.ensureFor(churchId);
    const order = new Map(congregations.map((one) => [one.id, one.position]));
    const active = new Set(congregations.filter((one) => one.isActive).map((one) => one.id));

    const meetings = await this.meetingsBetween(churchId, query.calendarId, from, to, only);
    const names = await this.believers.namesOf(
      meetings.flatMap((meeting) => (meeting.slots ?? []).map((slot) => slot.believerId)),
    );

    const patterns = (await this.patterns.activeFor(churchId, query.calendarId)).filter(
      (pattern) =>
        active.has(pattern.congregationId) && (!only || only.has(pattern.congregationId)),
    );

    const byDay = new Map<string, Meeting[]>();
    for (const meeting of meetings) {
      const day = toIsoDay(meeting.date);
      byDay.set(day, [...(byDay.get(day) ?? []), meeting]);
    }

    const days: CalendarDay[] = eachDay(from, to).map((date) => {
      const real = byDay.get(date) ?? [];
      const taken = new Set(real.map((meeting) => meeting.patternId));

      const proposed = patterns
        .filter((pattern) => appliesOn(pattern, date) && !taken.has(pattern.id))
        .map(proposedMeeting);

      return {
        date,
        meetings: [...real.map((meeting) => meetingView(meeting, names)), ...proposed].sort(
          byTimeThenCongregation(order),
        ),
      };
    });

    return { from, to, congregations, days };
  }

  /** Las reuniones materializadas del tramo, con sus fases. */
  meetingsBetween(
    churchId: string,
    calendarId: string,
    from: string,
    to: string,
    only?: ReadonlySet<string> | null,
  ): Promise<Meeting[]> {
    return this.meetings.find({
      where: {
        churchId,
        calendarId,
        date: Between(from, to),
        ...(only ? { congregationId: In([...only]) } : {}),
      },
      relations: { slots: true },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }
}

/** Un patrón se propone ese día si es su día de la semana y está vigente. */
function appliesOn(pattern: MeetingPattern, date: string): boolean {
  if (pattern.weekday !== weekdayOf(date)) return false;
  if (pattern.validFrom && date < toIsoDay(pattern.validFrom)) return false;
  if (pattern.validTo && date > toIsoDay(pattern.validTo)) return false;
  return true;
}

function checkRange({ from, to }: RangeQuery): { from: string; to: string } {
  const total = daysBetween(from, to) + 1;
  if (total <= 0) throw new BadRequestException('El rango de fechas está del revés');
  if (total > MAX_CALENDAR_RANGE_DAYS) {
    throw new BadRequestException(
      `El rango no puede pasar de ${String(MAX_CALENDAR_RANGE_DAYS)} días`,
    );
  }
  return { from, to };
}
