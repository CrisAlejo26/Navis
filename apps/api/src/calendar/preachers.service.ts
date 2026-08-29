import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  believerName,
  SCHEDULABLE_STATUSES,
  toSearchName,
  type Paginated,
  type Preacher,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { BelieverMinistry } from '../believers/believer-ministry.entity';
import { Believer } from '../believers/believer.entity';
import { nullsFor } from '../database/date-sql';
import { toIsoDay } from '../database/iso-day';
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
  /** Página y tamaño: el selector carga por tandas (ver `PreacherPicker`). */
  page: number;
  limit: number;
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
 *
 * **Pagina y no devuelve a todos**: con miles de creyentes, el selector no
 * puede traerse la lista entera en cada apertura. El orden —quien lleva más
 * tiempo sin subir primero— va en la consulta, como subconsulta contra las
 * reuniones de este calendario, para que cada página sea la correcta aunque
 * falten las demás.
 */
@Injectable()
export class PreachersService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(BelieverMinistry) private readonly ministries: Repository<BelieverMinistry>,
    @InjectRepository(MeetingSlot) private readonly slots: Repository<MeetingSlot>,
  ) {}

  async list(churchId: string, query: PreacherQuery): Promise<Paginated<Preacher>> {
    const builder = this.believers
      .createQueryBuilder('believer')
      .where('believer.churchId = :churchId', { churchId })
      // Quien ya no viene deja de proponerse: es lo que antes decía `is_active`
      // y ahora dice el estado (D2).
      .andWhere('believer.status IN (:...statuses)', { statuses: [...SCHEDULABLE_STATUSES] });

    if (query.q) {
      builder.andWhere('believer.searchName LIKE :q', { q: `%${toSearchName(query.q)}%` });
    }

    if (!query.all && query.ministry) {
      builder.andWhere(
        `EXISTS (SELECT 1 FROM believer_ministries m
                 WHERE m.believer_id = believer.id AND m.ministry = :ministry AND m.deleted_at IS NULL)`,
        { ministry: query.ministry },
      );
    }

    builder
      // Primero quien lleva más tiempo sin subir, y del todo arriba quien no ha
      // subido nunca. `NULLS FIRST` solo existe en Postgres (`nullsFor`).
      .orderBy(
        `(SELECT MAX(m.date) FROM meetings m
          INNER JOIN meeting_slots ms ON ms.meeting_id = m.id
          WHERE ms.believer_id = believer.id
            AND m.church_id = :lastChurchId AND m.calendar_id = :lastCalendarId
            AND m.deleted_at IS NULL AND m.status <> 'cancelada')`,
        'ASC',
        nullsFor('ASC'),
      )
      .addOrderBy('believer.searchName', 'ASC')
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .setParameters({ lastChurchId: churchId, lastCalendarId: query.calendarId });

    const [people, total] = await builder.getManyAndCount();
    const history = await this.history(churchId, query.calendarId, query.from, query.to);
    const ministriesOf = await this.ministriesOf(people.map((person) => person.id));

    return {
      items: people.map((person) => {
        const row = history.get(person.id);
        return {
          id: person.id,
          congregationId: person.congregationId,
          ministries: ministriesOf.get(person.id) ?? [],
          name: believerName(person),
          lastDate: row?.lastDate ?? null,
          timesInRange: row?.times ?? 0,
        };
      }),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  /** Las labores del lote, agrupadas por persona. */
  private async ministriesOf(ids: readonly string[]): Promise<Map<string, string[]>> {
    const unique = [...new Set(ids)].filter(Boolean);
    if (unique.length === 0) return new Map();

    const rows = await this.ministries.find({ where: { believerId: In(unique) } });
    const grouped = new Map<string, string[]>();
    for (const row of rows) {
      grouped.set(row.believerId, [...(grouped.get(row.believerId) ?? []), row.ministry]);
    }

    return grouped;
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
