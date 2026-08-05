import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isNoteKind, type NoteCounts, type NoteDay } from '@navis/shared';
import { Repository, type SelectQueryBuilder } from 'typeorm';

import { toIsoDay } from '../database/iso-day';
import { BelieverNote } from './believer-note.entity';

/** Ninguna de cada tipo. Escrito, y no derivado, para que falte una si se añade. */
const NINGUNA: NoteCounts = {
  seguimiento: 0,
  testimonio: 0,
  sueno: 0,
  vision: 0,
  experiencia: 0,
  don: 0,
  correccion: 0,
  total: 0,
};

export interface HistoryQuery {
  page: number;
  limit: number;
  kind?: string;
  /** Texto libre contra lo que contó, la indicación y el recordatorio. */
  search?: string;
}

/**
 * La **bitácora** de un hermano tal y como se lee: hacia atrás y de 20 en 20
 * (D11). Escribirla es otra cosa y vive en `BelieverNotesService`.
 */
@Injectable()
export class BelieverHistoryService {
  constructor(@InjectRepository(BelieverNote) private readonly notes: Repository<BelieverNote>) {}

  async list(
    believerId: string,
    options: HistoryQuery,
  ): Promise<{ items: BelieverNote[]; total: number }> {
    const builder = this.filtered(believerId, options)
      .orderBy('note.occurredAt', 'DESC')
      // A igual día, la última escrita arriba: es el orden en que se leería.
      .addOrderBy('note.createdAt', 'DESC')
      .offset((options.page - 1) * options.limit)
      .limit(options.limit);

    const [items, total] = await builder.getManyAndCount();
    return { items, total };
  }

  /** Cuántas hay de cada tipo: las pastillas de la bitácora (§7.5). */
  async countsOf(believerId: string, search?: string): Promise<NoteCounts> {
    const rows = await this.filtered(believerId, { page: 1, limit: 0, search })
      .select('note.kind', 'kind')
      .addSelect('COUNT(*)', 'total')
      .groupBy('note.kind')
      .getRawMany<{ kind: string; total: string | number }>();

    const counts: NoteCounts = { ...NINGUNA };

    for (const row of rows) {
      const total = Number(row.total);
      counts.total += total;
      // El tipo llega de la base de datos: uno que ya no exista no cuenta para
      // ninguna pastilla, pero sí para el total (Regla 10).
      if (isNoteKind(row.kind)) counts[row.kind] = total;
    }

    return counts;
  }

  /**
   * Qué días tienen notas y de qué tipo, para la vista de calendario (§7.5).
   *
   * Va aparte del listado y no paginado porque son datos distintos: aquí no se
   * lee el texto, solo se marca el día. Un año son 365 filas como mucho, y es
   * justo lo que hace visible el hueco de tres meses en los que nadie escribió.
   */
  async days(believerId: string, from: string, to: string): Promise<NoteDay[]> {
    const rows = await this.notes
      .createQueryBuilder('note')
      .select('note.occurred_at', 'date')
      .addSelect('note.kind', 'kind')
      .addSelect('COUNT(*)', 'total')
      .where('note.believerId = :believerId', { believerId })
      .andWhere('note.occurredAt >= :from AND note.occurredAt <= :to', { from, to })
      .groupBy('note.occurred_at')
      .addGroupBy('note.kind')
      .getRawMany<{ date: string | Date; kind: string; total: string | number }>();

    const byDay = new Map<string, NoteDay>();
    for (const row of rows) {
      const date = toIsoDay(row.date);
      const day = byDay.get(date) ?? { date, kinds: [], total: 0 };

      day.total += Number(row.total);
      if (isNoteKind(row.kind) && !day.kinds.includes(row.kind)) day.kinds.push(row.kind);
      byDay.set(date, day);
    }

    return [...byDay.values()].sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * El tipo y la búsqueda, que es lo único que acota una bitácora.
   *
   * La búsqueda se resuelve **en el servidor** porque la bitácora se pagina:
   * filtrar en el cliente solo encontraría lo que ya se ha traído, y eso en un
   * historial de diez años es mentir al que busca.
   */
  private filtered(believerId: string, options: HistoryQuery): SelectQueryBuilder<BelieverNote> {
    const builder = this.notes
      .createQueryBuilder('note')
      .where('note.believerId = :believerId', { believerId });

    if (options.kind) builder.andWhere('note.kind = :kind', { kind: options.kind });

    if (options.search) {
      // En minúsculas por los dos lados: en Postgres `LIKE` distingue
      // mayúsculas y en SQLite no, y así se comportan igual.
      builder.andWhere(
        `(LOWER(note.told) LIKE :search
          OR LOWER(COALESCE(note.advice, '')) LIKE :search
          OR LOWER(COALESCE(note.remind_text, '')) LIKE :search)`,
        { search: `%${options.search.toLowerCase()}%` },
      );
    }

    return builder;
  }
}
