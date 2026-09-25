import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EXPORT_MAX_ROWS, type ExportResponse, type RowData } from '@navis/shared';
import { Repository } from 'typeorm';

import { believerSearchExpr } from '../database/believer-field-sql';
import { CustomTable } from './custom-table.entity';
import { CustomTableRow } from './custom-table-row.entity';
import { boundColumnsOf, fillBoundData } from './table-believer-overlay';
import { TableBelieversResolver } from './table-believers-resolver.service';
import { parseRowFilters } from './parse-row-filters';
import { decryptTableField, isEncryptedTableField } from './table-field-crypto';
import { parseRowData } from './table-row.mapper';
import { applyBelieverRowFilter, applyRowFilter } from './table-row-filters';
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
 *
 * Con la tabla enlazada a creyentes, las columnas vinculadas se resuelven
 * igual que en la cuadrícula (RFC 0025 D11): lo que se exporta es lo que se
 * ve, no una copia helada del JSON.
 */
@Injectable()
export class TableRowsExportService {
    constructor(
        @InjectRepository(CustomTableRow) private readonly rows: Repository<CustomTableRow>,
        @InjectRepository(CustomTable) private readonly tables: Repository<CustomTable>,
        private readonly resolver: TableBelieversResolver,
        private readonly columnsService: TableColumnsService,
    ) {}

    async export(
        tableId: string,
        churchId: string,
        query: TableExportQuery,
        includePasswords: boolean,
    ): Promise<ExportResponse<RowData>> {
        const table = await this.tables.findOne({ where: { id: tableId, churchId } });
        if (!table) throw new NotFoundException('Esa tabla no existe en esta iglesia');
        const linked = table.source === 'believers';
        const columns = (await this.columnsService.listActive(tableId)).map(toColumnView);

        const builder = this.rows
            .createQueryBuilder('row')
            .where('row.tableId = :tableId', { tableId });
        if (query.search) {
            builder.andWhere(
                linked
                    ? `(LOWER(row.data) LIKE LOWER(:search) OR ${believerSearchExpr('search')})`
                    : 'LOWER(row.data) LIKE LOWER(:search)',
                { search: `%${query.search}%` },
            );
        }
        parseRowFilters(query.filters).forEach((filter, index) => {
            const column = columns.find((one) => one.key === filter.columnKey);
            if (linked && column?.believerField) {
                applyBelieverRowFilter(builder, column, filter, index);
            } else {
                applyRowFilter(builder, columns, filter, index);
            }
        });

        const total = await builder.getCount();
        const entities = await builder
            .orderBy('row.createdAt', 'ASC')
            .limit(EXPORT_MAX_ROWS)
            .getMany();

        const passwordKeys = new Set(
            columns.filter((one) => one.type === 'password').map((one) => one.key),
        );
        const vinculadas = linked ? boundColumnsOf(columns) : [];
        const resueltos = linked ? await this.resolver.resolve(entities, table.churchId) : [];

        const rows = entities.map((row, index) => {
            const out = exportRow(
                row,
                columns.map((one) => one.key),
                passwordKeys,
                includePasswords,
            );
            const one = resueltos[index] ?? null;
            fillBoundData(out, vinculadas, one?.believer ?? null, one?.congregationName ?? null);
            return out;
        });

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
