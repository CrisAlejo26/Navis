import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  addDays,
  startOfWeek,
  DASHBOARD_ACTIVITY_WEEKS,
  type DashboardWeekActivity,
  type IsoDate,
} from '@navis/shared';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { BelieverNote } from '../believers/believer-note.entity';

/**
 * Notas escritas por semana, las últimas {@link DASHBOARD_ACTIVITY_WEEKS}.
 *
 * Se agrupa **en JS** y no con una función de fecha en SQL: son como mucho
 * unas pocas decenas de notas en seis semanas, y así el cálculo del lunes de
 * cada semana es el mismo `startOfWeek` que ya usa el calendario, sin escribir
 * una segunda versión para Postgres y otra para SQLite (Regla 1).
 */
@Injectable()
export class DashboardActivityService {
  constructor(@InjectRepository(BelieverNote) private readonly notes: Repository<BelieverNote>) {}

  async weekly(churchId: string, today: IsoDate): Promise<DashboardWeekActivity[]> {
    const weeks = lastWeeks(today, DASHBOARD_ACTIVITY_WEEKS);
    const since = weeks[0];
    if (!since) return [];

    const rows = await this.notes.find({
      where: { churchId, occurredAt: MoreThanOrEqual(since) },
      select: { occurredAt: true },
    });

    const counts = new Map<string, number>();
    for (const row of rows) {
      const week = startOfWeek(row.occurredAt);
      counts.set(week, (counts.get(week) ?? 0) + 1);
    }

    // Rellena las semanas sin ninguna nota con cero: sin eso, una gráfica con
    // huecos parece que falten datos y no que no se escribió nada esa semana.
    return weeks.map((week) => ({ week, notes: counts.get(week) ?? 0 }));
  }
}

/** El lunes de cada una de las últimas `total` semanas, la más antigua primero. */
function lastWeeks(today: IsoDate, total: number): IsoDate[] {
  const currentWeek = startOfWeek(today);
  return Array.from({ length: total }, (_unused, index) =>
    addDays(currentWeek, -7 * (total - 1 - index)),
  );
}
