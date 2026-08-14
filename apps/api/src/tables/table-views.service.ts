import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreateTableViewInput, UpdateTableViewInput } from '@navis/shared';
import { Repository } from 'typeorm';

import { CustomTableView } from './custom-table-view.entity';
import { TableColumnsService } from './table-columns.service';

/**
 * Las vistas guardadas de una tabla: tablero y calendario (RFC 0021 D24–D27).
 *
 * La de cuadrícula no vive aquí: se sintetiza en el cliente y no se puede
 * borrar (D24). Solo se crean las dos que piden una columna concreta —el
 * tablero necesita una de selección única, el calendario una de fecha—, y esa
 * columna tiene que existir y estar activa.
 */
@Injectable()
export class TableViewsService {
  constructor(
    @InjectRepository(CustomTableView) private readonly views: Repository<CustomTableView>,
    private readonly columns: TableColumnsService,
  ) {}

  list(tableId: string): Promise<CustomTableView[]> {
    return this.views.find({ where: { tableId }, order: { position: 'ASC' } });
  }

  async create(tableId: string, input: CreateTableViewInput): Promise<CustomTableView> {
    const active = await this.columns.listActive(tableId);

    if (input.type === 'kanban') {
      const column = active.find(
        (one) => one.key === input.groupBy && one.type === 'single_select',
      );
      if (!column)
        throw new BadRequestException('El tablero necesita una columna de selección única');
    }
    if (input.type === 'calendar') {
      const column = active.find((one) => one.key === input.dateColumn && one.type === 'date');
      if (!column) throw new BadRequestException('El calendario necesita una columna de fecha');
    }

    const count = await this.views.count({ where: { tableId } });

    return this.views.save(
      this.views.create({
        tableId,
        name: input.name,
        type: input.type,
        groupBy: input.type === 'kanban' ? (input.groupBy ?? null) : null,
        dateColumn: input.type === 'calendar' ? (input.dateColumn ?? null) : null,
        filters: '[]',
        sortOrder: 'desc',
        position: count,
      }),
    );
  }

  async update(tableId: string, id: string, input: UpdateTableViewInput): Promise<CustomTableView> {
    const view = await this.require(tableId, id);

    if (input.name !== undefined) view.name = input.name;
    if (input.filters !== undefined) view.filters = JSON.stringify(input.filters);
    if (input.sortBy !== undefined) view.sortBy = input.sortBy;
    if (input.sortOrder !== undefined) view.sortOrder = input.sortOrder;

    return this.views.save(view);
  }

  async remove(tableId: string, id: string): Promise<void> {
    await this.views.remove(await this.require(tableId, id));
  }

  async require(tableId: string, id: string): Promise<CustomTableView> {
    const view = await this.views.findOne({ where: { id, tableId } });
    if (!view) throw new NotFoundException('Esa vista no existe en esta tabla');
    return view;
  }
}
