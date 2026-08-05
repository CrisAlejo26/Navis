import { Injectable } from '@nestjs/common';
import type { ListViewer as ListViewerView } from '@navis/shared';

import { ListGrantsService } from './list-grants.service';
import type { ListViewer } from './list-viewer.entity';
import { ListViewersService } from './list-viewers.service';
import { toListViewerView } from './list-viewers.mapper';

/**
 * El directorio ya compuesto: cada acceso con su creyente y **a cuántas listas
 * llega** (RFC 0010 §8.5).
 *
 * Está aparte de `ListViewersService` porque aquello escribe y esto lee: la
 * pantalla que contesta «¿a qué llega Juan?» sin recorrer siete listas necesita
 * cruzar tres tablas, y el servicio de altas no tiene por qué saberlo.
 */
@Injectable()
export class ListDirectoryService {
  constructor(
    private readonly viewers: ListViewersService,
    private readonly grants: ListGrantsService,
  ) {}

  async of(churchId: string): Promise<ListViewerView[]> {
    return this.compose(await this.viewers.list(churchId));
  }

  async one(viewer: ListViewer): Promise<ListViewerView> {
    const [view] = await this.compose([viewer]);
    return view ?? toListViewerView(viewer, []);
  }

  private async compose(viewers: ListViewer[]): Promise<ListViewerView[]> {
    if (viewers.length === 0) return [];

    const [people, listas] = await Promise.all([
      this.viewers.believersOf(viewers),
      this.grants.listsOf(viewers.map((one) => one.id)),
    ]);

    return viewers.map((viewer) =>
      toListViewerView(
        viewer,
        listas.get(viewer.id) ?? [],
        viewer.believerId ? people.get(viewer.believerId) : undefined,
      ),
    );
  }
}
