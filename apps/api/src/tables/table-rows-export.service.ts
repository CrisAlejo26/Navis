import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EXPORT_MAX_ROWS, type ExportResponse, type RowData } from '@navis/shared';
import { Repository } from 'typeorm';

import { CustomTableRow } from './custom-table-row.entity';
import { parseRowFilters } from './parse-row-filters';
import { decryptTableField, isEncryptedTableField } from './table-field-crypto';
import { parseRowData } from './table-row.mapper';
import { applyRowFilter } from './table-row-filters';
import { TableColumnsService } from './table-columns.service';
import { toColumnView } from './tables.mapper';

export interface TableExportQuery {
  search?: string;
  filters?: string;
}

/**
 * Las filas de una tabla para exportarlas, con la vista y los filtros activos
 * (RFC 0021 D23).
 *
 * Las contraseñas se excluyen **por defecto**: solo se descifran cuando
 * `includePasswords` viene explícito, después de que la interfaz haya avisado
 * de cuántas van a salir en claro (D23), igual que la hoja de credenciales de
 * listas (RFC 0010 D29).
 */
@Injectable()
export class TableRowsExportService {
  constructor(
    @InjectRepository(CustomTableRow) private readonly rows: Repository<CustomTableRow>,
    private readonly columnsService: TableColumnsService,
  ) {}

  async export(
    tableId: string,
    query: TableExportQuery,
    includePasswords: boolean,
  ): Promise<ExportResponse<RowData>> {
    const columns = (await this.columnsService.listActive(tableId)).map(toColumnView);

    const builder = this.rows
      .createQueryBuilder('row')
      .where('row.tableId = :tableId', { tableId });
    if (query.search) {
      builder.andWhere('LOWER(row.data) LIKE LOWER(:search)', { search: `%${query.search}%` });
    }
    parseRowFilters(query.filters).forEach((filter, index) => {
      applyRowFilter(builder, columns, filter, index);
    });

    const total = await builder.getCount();
    const entities = await builder.orderBy('row.createdAt', 'ASC').limit(EXPORT_MAX_ROWS).getMany();

    const passwordKeys = new Set(
      columns.filter((one) => one.type === 'password').map((one) => one.key),
    );
    const rows = entities.map((row) =>
      exportRow(
        row,
        columns.map((one) => one.key),
        passwordKeys,
        includePasswords,
      ),
    );

    return { rows, total, returned: rows.length, truncated: total > rows.length };
  }
}

function exportRow(
  row: CustomTableRow,
  keys: readonly string[],
  passwordKeys: ReadonlySet<string>,
  includePasswords: boolean,
): RowData {
  const raw = parseRowData(row.data);
  const out: RowData = {};

  for (const key of keys) {
    if (!(key in raw)) continue;
    if (!passwordKeys.has(key)) {
      out[key] = raw[key];
      continue;
    }
    if (includePasswords) out[key] = plainOf(raw[key]);
  }

  return out;
}

function plainOf(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  return isEncryptedTableField(value) ? decryptTableField(value) : value;
}
