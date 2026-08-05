import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DEFAULT_CONGREGATION_ACCENT,
  LIST_WAKE_DAYS,
  type ListDay,
  type ListStats,
} from '@navis/shared';
import { In, MoreThanOrEqual, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { toIsoDay } from '../database/iso-day';
import { ListView } from './list-view.entity';
import { ListViewer } from './list-viewer.entity';

const DIA_MS = 86_400_000;

/**
 * Quién mira la lista y cuándo (RFC 0010 §7.4).
 *
 * `days[]` viene **relleno con ceros**, incluidos los días sin visitas: si el
 * cliente tuviera que rellenar huecos con fechas, ahí es donde se cuelan los
 * errores de huso. Y el día se calcula en JS sobre el ISO de `iso-day.ts`, no
 * con `EXTRACT(DOW)` ni `strftime`, que no se escriben igual en los dos motores.
 */
@Injectable()
export class ListAudienceService {
  constructor(
    @InjectRepository(ListView) private readonly views: Repository<ListView>,
    @InjectRepository(ListViewer) private readonly viewers: Repository<ListViewer>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
  ) {}

  async of(listId: string): Promise<ListStats['audience']> {
    const rows = await this.views.find({ where: { listId }, order: { viewedAt: 'ASC' } });

    return {
      views: rows.reduce((total, row) => total + row.views, 0),
      visitors: new Set(rows.map((row) => row.viewerId ?? row.visitorHash)).size,
      firstViewAt: rows[0]?.viewedAt.toISOString() ?? null,
      lastViewAt: rows.at(-1)?.viewedAt.toISOString() ?? null,
      days: daysOf(rows, LIST_WAKE_DAYS),
      byDevice: count(rows, (row) => row.device),
      byPlatform: count(rows, (row) => row.platform),
      byReferrer: count(rows, (row) => row.referrerHost ?? 'directo'),
      byHour: hoursOf(rows),
      byViewer: await this.byViewer(rows),
    };
  }

  /** Los últimos catorce días de una lista, para la estela en miniatura (§8.2). */
  async recent(listIds: readonly string[], days: number): Promise<Map<string, number[]>> {
    const byList = new Map(listIds.map((id) => [id, Array.from({ length: days }, () => 0)]));
    if (listIds.length === 0) return byList;

    const desde = new Date(Date.now() - (days - 1) * DIA_MS);
    desde.setHours(0, 0, 0, 0);

    const rows = await this.views.find({
      where: { listId: In([...listIds]), viewedAt: MoreThanOrEqual(desde) },
    });

    const primer = toIsoDay(desde);
    for (const row of rows) {
      const index = daysBetween(primer, toIsoDay(row.viewedAt));
      const serie = byList.get(row.listId);
      if (serie && index >= 0 && index < days) serie[index] = (serie[index] ?? 0) + row.views;
    }

    return byList;
  }

  /**
   * Con accesos, «cuánta gente» pasa a ser **«quién»** (D35): la ficha deja de
   * decir «14 visitas de 9 personas» y pasa a decir «Juan Pérez, ayer a las
   * 21:14 · 12 entradas», con su foto si el acceso está enlazado a un creyente.
   */
  private async byViewer(rows: readonly ListView[]): Promise<ListStats['audience']['byViewer']> {
    const ids = [...new Set(rows.flatMap((row) => (row.viewerId ? [row.viewerId] : [])))];
    if (ids.length === 0) return [];

    const accesos = await this.viewers.find({ where: { id: In(ids) }, withDeleted: true });
    const conFoto = new Set(
      (
        await this.believers.find({
          where: { id: In(accesos.flatMap((one) => (one.believerId ? [one.believerId] : []))) },
        })
      )
        .filter((person) => person.photoKey)
        .map((person) => person.id),
    );

    return accesos
      .map((acceso) => {
        const suyas = rows.filter((row) => row.viewerId === acceso.id);
        return {
          viewerId: acceso.id,
          label: acceso.label,
          believerId: acceso.believerId,
          believerHasPhoto: Boolean(acceso.believerId && conFoto.has(acceso.believerId)),
          views: suyas.reduce((total, row) => total + row.views, 0),
          lastAt: (suyas.at(-1) ?? suyas[0])?.viewedAt.toISOString() ?? '',
        };
      })
      .sort((uno, otro) => otro.views - uno.views);
  }
}

function daysBetween(desde: string, hasta: string): number {
  return Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA_MS);
}

function daysOf(rows: readonly ListView[], days: number): ListDay[] {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const serie: ListDay[] = Array.from({ length: days }, (_, index) => ({
    day: toIsoDay(new Date(hoy.getTime() - (days - 1 - index) * DIA_MS)),
    views: 0,
    visitors: 0,
  }));

  const visitantes = serie.map(() => new Set<string>());
  const primer = serie[0]?.day ?? toIsoDay(hoy);

  for (const row of rows) {
    const index = daysBetween(primer, toIsoDay(row.viewedAt));
    const dia = serie[index];
    if (!dia) continue;

    dia.views += row.views;
    visitantes[index]?.add(row.viewerId ?? row.visitorHash);
  }

  for (const [index, dia] of serie.entries()) dia.visitors = visitantes[index]?.size ?? 0;

  return serie;
}

function count(
  rows: readonly ListView[],
  pick: (row: ListView) => string | null,
): { label: string; accent: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const label = pick(row);
    if (label) counts.set(label, (counts.get(label) ?? 0) + row.views);
  }

  return [...counts]
    .map(([label, total]) => ({ label, accent: DEFAULT_CONGREGATION_ACCENT, count: total }))
    .sort((uno, otro) => otro.count - uno.count);
}

/** Las veinticuatro horas, con las vacías a cero: es un reloj, no una lista. */
function hoursOf(rows: readonly ListView[]): { hour: number; count: number }[] {
  const horas = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const row of rows) {
    const hora = horas[row.viewedAt.getHours()];
    if (hora) hora.count += row.views;
  }

  return horas;
}
