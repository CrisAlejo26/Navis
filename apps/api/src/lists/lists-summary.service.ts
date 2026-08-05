import { Injectable } from '@nestjs/common';
import type { ListSummary } from '@navis/shared';

import { ListAudienceService } from './list-audience.service';
import { ListMembersService } from './list-members.service';
import { ListRowsService } from './list-rows.service';
import type { List } from './list.entity';
import { toListView } from './lists.mapper';

/** Cuántos días de estela lleva el panel del tablón, y cuántas iniciales (§8.2). */
const DIAS_MINIATURA = 14;
const INICIALES = 8;

/**
 * El **tablón**: cada lista con lo que hace falta para pintar su panel.
 *
 * Las iniciales de los primeros ocho están porque se reconoce la lista por su
 * gente antes de leer el nombre, y la estela en miniatura porque es lo que le da
 * pulso a la portada en vez de ser un menú.
 */
@Injectable()
export class ListsSummaryService {
  constructor(
    private readonly rows: ListRowsService,
    private readonly members: ListMembersService,
    private readonly audience: ListAudienceService,
  ) {}

  async of(lists: readonly List[]): Promise<ListSummary[]> {
    const ids = lists.map((one) => one.id);
    const [counts, estelas] = await Promise.all([
      this.members.counts(ids),
      this.audience.recent(
        lists.filter((one) => one.visibility !== 'private').map((one) => one.id),
        DIAS_MINIATURA,
      ),
    ]);

    const summaries: ListSummary[] = [];

    for (const list of lists) {
      const miembros = await this.rows.view(list.id);

      summaries.push({
        ...toListView(list, counts.get(list.id) ?? 0),
        initials: miembros.slice(0, INICIALES).map(initialsOf),
        recentViews: estelas.get(list.id) ?? [],
      });
    }

    return summaries;
  }
}

/** `Juan Pérez` → `JP`. Sin apellido, la primera letra basta. */
function initialsOf(member: { firstName: string; lastName: string }): string {
  const nombre = member.firstName.trim().charAt(0);
  const apellido = member.lastName.trim().charAt(0);

  return `${nombre}${apellido}`.toUpperCase() || '·';
}
