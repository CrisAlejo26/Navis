import { Injectable } from '@nestjs/common';
import type { CalendarSummary, PreacherBalance } from '@navis/shared';

import { BelieversRosterService } from '../believers/believers-roster.service';
import { toIsoDay } from '../database/iso-day';
import { buildWarnings, type Assignment, type Gap } from './calendar-warnings';
import { ScheduleService, type RangeQuery } from './schedule.service';

/**
 * El reparto del tramo: quién ha subido cuántas veces, cuándo fue la última y
 * en qué sedes, más los avisos. Es lo que hoy no existe en ninguna parte y lo
 * que evita cargar siempre a los mismos tres.
 *
 * Solo mira reuniones **materializadas**: una propuesta que nadie ha tocado no
 * tiene a nadie asignado, y contarla como hueco sería inundar de avisos los
 * meses que todavía no se han programado.
 */
@Injectable()
export class SummaryService {
  constructor(
    private readonly schedule: ScheduleService,
    private readonly believers: BelieversRosterService,
  ) {}

  async summary(churchId: string, query: RangeQuery): Promise<CalendarSummary> {
    const only = query.congregationIds?.length ? new Set(query.congregationIds) : null;
    const meetings = await this.schedule.meetingsBetween(
      churchId,
      query.calendarId,
      query.from,
      query.to,
      only,
    );

    const names = await this.believers.namesOf(
      meetings.flatMap((meeting) => (meeting.slots ?? []).map((slot) => slot.believerId)),
    );

    const assignments: Assignment[] = [];
    const gaps: Gap[] = [];

    for (const meeting of meetings) {
      if (meeting.status === 'cancelada') continue;
      const date = toIsoDay(meeting.date);

      for (const slot of meeting.slots ?? []) {
        const detail = `${meeting.name} · ${slot.name}`;

        if (!slot.believerId) {
          gaps.push({ date, congregationId: meeting.congregationId, detail });
          continue;
        }

        assignments.push({
          believerId: slot.believerId,
          name: names.get(slot.believerId) ?? '—',
          date,
          congregationId: meeting.congregationId,
          detail,
        });
      }
    }

    return {
      from: query.from,
      to: query.to,
      people: balance(assignments),
      warnings: buildWarnings(assignments, gaps),
    };
  }
}

/** Ordenado por quien más veces sube: es la lectura que se busca al abrirlo. */
function balance(assignments: readonly Assignment[]): PreacherBalance[] {
  const people = new Map<string, PreacherBalance>();

  for (const one of assignments) {
    const current = people.get(one.believerId);

    if (!current) {
      people.set(one.believerId, {
        believerId: one.believerId,
        name: one.name,
        times: 1,
        lastDate: one.date,
        congregationIds: [one.congregationId],
      });
      continue;
    }

    current.times += 1;
    if (!current.lastDate || one.date > current.lastDate) current.lastDate = one.date;
    if (!current.congregationIds.includes(one.congregationId)) {
      current.congregationIds.push(one.congregationId);
    }
  }

  return [...people.values()].sort((a, b) => b.times - a.times || a.name.localeCompare(b.name));
}
