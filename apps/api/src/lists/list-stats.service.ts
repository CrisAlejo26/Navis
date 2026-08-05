import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LIST_ACCESS_LOG_LIMIT, type ListAccessEntry, type ListStats } from '@navis/shared';
import { In, MoreThanOrEqual, Not, Repository } from 'typeorm';

import { ListAccessLog } from './list-access-log.entity';
import { ListAudienceService } from './list-audience.service';
import { ListGrantsService } from './list-grants.service';
import { ListMemberStatsService } from './list-member-stats.service';
import { ListOverlapService } from './list-overlap.service';
import { ListViewsService } from './list-views.service';
import { ListViewer } from './list-viewer.entity';
import type { List } from './list.entity';

/**
 * Las estadísticas de una lista: composición, audiencia, solapamiento y puerta.
 *
 * Aquí también es donde corre **la poda de los 180 días** (D34): la API no
 * tiene programador de tareas y meter `@nestjs/schedule` para un `DELETE` sería
 * una dependencia por nada.
 */
@Injectable()
export class ListStatsService {
  constructor(
    @InjectRepository(ListAccessLog) private readonly log: Repository<ListAccessLog>,
    @InjectRepository(ListViewer) private readonly viewers: Repository<ListViewer>,
    private readonly members: ListMemberStatsService,
    private readonly overlap: ListOverlapService,
    private readonly audience: ListAudienceService,
    private readonly grants: ListGrantsService,
    private readonly views: ListViewsService,
  ) {}

  async of(list: List): Promise<ListStats> {
    await this.views.prune();

    const [members, overlap, audience] = await Promise.all([
      this.members.of(list.churchId, list.id),
      this.overlap.of(list.churchId, list.id),
      this.audience.of(list.id),
    ]);

    return { members, overlap, audience, access: await this.access(list) };
  }

  /** Los últimos cincuenta intentos, para la pestaña de compartir (§7.1). */
  async recentAttempts(listId: string): Promise<ListAccessEntry[]> {
    const rows = await this.log.find({
      where: { listId },
      order: { at: 'DESC' },
      take: LIST_ACCESS_LOG_LIMIT,
    });

    return rows.map((row) => ({
      username: row.username,
      outcome: row.outcome,
      at: row.at.toISOString(),
      ipPrefix: row.ipPrefix,
    }));
  }

  /**
   * Solo tiene sentido en una restringida. `neverEntered` no es relleno: es lo
   * que dice que a alguien se le dio una llave y nunca la usó, que casi siempre
   * significa que el mensaje no le llegó.
   */
  private async access(list: List): Promise<ListStats['access']> {
    if (list.visibility !== 'restricted') {
      return { granted: 0, neverEntered: 0, failedLast7Days: 0, recent: [] };
    }

    const viewerIds = await this.grants.viewersOf(list.id);
    const concedidos = viewerIds.length
      ? await this.viewers.find({ where: { id: In(viewerIds) } })
      : [];

    const hace7 = new Date(Date.now() - 7 * 86_400_000);

    return {
      granted: concedidos.length,
      neverEntered: concedidos.filter((one) => !one.lastSeenAt).length,
      failedLast7Days: await this.log.count({
        where: { listId: list.id, at: MoreThanOrEqual(hace7), outcome: Not('ok') },
      }),
      recent: await this.recentAttempts(list.id),
    };
  }
}
