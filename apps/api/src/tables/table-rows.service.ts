import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type {
  CreateTableRowInput,
  CustomTableRow as CustomTableRowView,
  Paginated,
  UpdateTableRowInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { CustomTableRow } from './custom-table-row.entity';
import { decryptTableField, isEncryptedTableField } from './table-field-crypto';
import { prepareRowData } from './table-row-data';
import { parseRowData, toRowView } from './table-row.mapper';
import { TableColumnsService } from './table-columns.service';
import { TableRowsPageService, type RowsPageQuery } from './table-rows-page.service';
import { toColumnView } from './tables.mapper';

/** Las filas de una tabla personalizada (RFC 0021, «Las filas»). */
@Injectable()
export class TableRowsService {
  constructor(
    @InjectRepository(CustomTableRow) private readonly rows: Repository<CustomTableRow>,
    private readonly columns: TableColumnsService,
    private readonly page: TableRowsPageService,
  ) {}

  async findPage(tableId: string, query: RowsPageQuery): Promise<Paginated<CustomTableRowView>> {
    return this.page.findPage(tableId, query, await this.activeColumnViews(tableId));
  }

  async create(
    tableId: string,
    by: string,
    input: CreateTableRowInput,
  ): Promise<CustomTableRowView> {
    const columns = await this.activeColumnViews(tableId);
    const data = prepareRowData(columns, input.data, {});

    const row = await this.rows.save(
      this.rows.create({ tableId, data: JSON.stringify(data), createdBy: by }),
    );
    return toRowView(row, columns);
  }

  async update(
    tableId: string,
    id: string,
    input: UpdateTableRowInput,
  ): Promise<CustomTableRowView> {
    const columns = await this.activeColumnViews(tableId);
    const row = await this.require(tableId, id);

    row.data = JSON.stringify(prepareRowData(columns, input.data, parseRowData(row.data)));
    await this.rows.save(row);

    return toRowView(row, columns);
  }

  async remove(tableId: string, id: string): Promise<void> {
    await this.rows.softRemove(await this.require(tableId, id));
  }

  async require(tableId: string, id: string): Promise<CustomTableRow> {
    const row = await this.rows.findOne({ where: { id, tableId } });
    if (!row) throw new NotFoundException('Esa fila no existe en esta tabla');
    return row;
  }

  /** El texto claro de una celda de tipo contraseña (D22): un gesto explícito, no en cada listado. */
  async reveal(tableId: string, id: string, columnKey: string): Promise<string> {
    const columns = await this.activeColumnViews(tableId);
    if (!columns.some((one) => one.key === columnKey && one.type === 'password')) {
      throw new NotFoundException('Esa columna no existe en esta tabla');
    }

    const row = await this.require(tableId, id);
    const raw = parseRowData(row.data)[columnKey];
    if (typeof raw !== 'string' || !raw) return '';

    return isEncryptedTableField(raw) ? decryptTableField(raw) : raw;
  }

  private async activeColumnViews(tableId: string) {
    return (await this.columns.listActive(tableId)).map(toColumnView);
  }
}
