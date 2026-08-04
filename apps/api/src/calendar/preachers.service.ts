import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { believerName, type Preacher } from '@navis/shared';
import { Repository } from 'typeorm';

import { BelieversService } from '../believers/believers.service';
import { toIsoDay } from './calendar-format';
import { MeetingSlot } from './meeting-slot.entity';

export interface PreacherQuery {
  /** El calendario que se está programando: acota el historial. */
  calendarId: string;
  /** El ministerio del calendario; sin él, se propone a cualquiera (D16). */
  ministry: string | null;
  q?: string;
  /** Cualquier creyente activo, no solo quien tiene el ministerio de púlpito. */
  all?: boolean;
  /** El tramo que se está mirando, para contar cuántas veces lleva en él. */
  from: string;
  to: string;
}

interface HistoryRow {
  believerId: string;
  lastDate: string | null;
  timesInRange: string | number | null;
}

/**
 * Los candidatos del selector, con lo único que hace falta para decidir:
 * cuándo subió por última vez y cuántas veces lleva en el tramo.
 *
 * Vive aquí y no en creyentes, y lo protege `calendar.manage` (D10): programar
 * no puede obligar a abrir la ficha pastoral de nadie.
 */
@Injectable()
export class PreachersService {
  constructor(
    @InjectRepository(MeetingSlot) private readonly slots: Repository<MeetingSlot>,
    private readonly believers: BelieversService,
  ) {}

  async list(churchId: string, query: PreacherQuery): Promise<Preacher[]> {
    const people = await this.believers.list(churchId, {
      q: query.q,
      ministry: query.all ? undefined : (query.ministry ?? undefined),
    });

    const history = await this.history(churchId, query.calendarId, query.from, query.to);

    return people
      .map((person) => {
        const row = history.get(person.id);
        return {
          id: person.id,
          congregationId: person.congregationId,
          ministries: (person.ministries ?? []).map((one) => one.ministry),
          name: believerName(person),
          lastDate: row?.lastDate ?? null,
          timesInRange: row?.times ?? 0,
        };
      })
      .sort(byLongestWithoutPreaching);
  }

  /** Última vez y veces en el tramo, de una sola consulta agrupada. */
  private async history(
    churchId: string,
    calendarId: string,
    from: string,
    to: string,
  ): Promise<Map<string, { lastDate: string | null; times: number }>> {
    const rows = await this.slots
      .createQueryBuilder('slot')
      .innerJoin(
        'meetings',
        'meeting',
        'meeting.id = slot.meeting_id AND meeting.deleted_at IS NULL',
      )
      .select('slot.believer_id', 'believerId')
      .addSelect('MAX(meeting.date)', 'lastDate')
      .addSelect(
        'SUM(CASE WHEN meeting.date >= :from AND meeting.date <= :to THEN 1 ELSE 0 END)',
        'timesInRange',
      )
      .where('meeting.church_id = :churchId', { churchId })
      // El historial es **de este calendario**: quien lleva el sonido no compite
      // con quien predica.
      .andWhere('meeting.calendar_id = :calendarId', { calendarId })
      .andWhere('slot.believer_id IS NOT NULL')
      .andWhere("meeting.status <> 'cancelada'")
      .setParameters({ from, to })
      .groupBy('slot.believer_id')
      .getRawMany<HistoryRow>();

    return new Map(
      rows.map((row) => [
        row.believerId,
        {
          lastDate: row.lastDate ? toIsoDay(row.lastDate) : null,
          times: Number(row.timesInRange ?? 0),
        },
      ]),
    );
  }
}

/**
 * Primero quien lleva más tiempo sin subir, y del todo arriba quien no ha
 * subido nunca. Es la pregunta que se está haciendo quien programa, y por eso
 * no se ordena alfabéticamente.
 */
function byLongestWithoutPreaching(a: Preacher, b: Preacher): number {
  if (a.lastDate === b.lastDate) return a.name.localeCompare(b.name);
  if (!a.lastDate) return -1;
  if (!b.lastDate) return 1;
  return a.lastDate.localeCompare(b.lastDate);
}
