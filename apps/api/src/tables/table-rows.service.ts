import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
    type AddTableBelieversInput,
    type CreateTableRowInput,
    type CustomTableRow as CustomTableRowView,
    type Paginated,
    type UpdateTableRowInput,
} from '@navis/shared';
import { Believer } from '../believers/believer.entity';
import { In, IsNull, Not, Repository } from 'typeorm';

import { CustomTable } from './custom-table.entity';
import { CustomTableRow } from './custom-table-row.entity';
import { boundColumnsOf } from './table-believer-overlay';
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
        @InjectRepository(CustomTable) private readonly tables: Repository<CustomTable>,
        @InjectRepository(Believer) private readonly believers: Repository<Believer>,
        private readonly columns: TableColumnsService,
        private readonly page: TableRowsPageService,
    ) {}

    async findPage(
        tableId: string,
        churchId: string,
        query: RowsPageQuery,
    ): Promise<Paginated<CustomTableRowView>> {
        const table = await this.requireTable(tableId, churchId);
        return this.page.findPage(table, query, await this.activeColumnViews(tableId));
    }

    async create(
        tableId: string,
        churchId: string,
        by: string,
        input: CreateTableRowInput,
    ): Promise<CustomTableRowView> {
        const table = await this.requireTable(tableId, churchId);
        const columns = await this.activeColumnViews(tableId);
        const vinculadas = vinculadasDe(columns, table);
        requireNoBoundKeys(input.data, vinculadas);

        const data = prepareRowData(
            columns.filter((one) => !one.believerField),
            input.data,
            {},
        );

        const believerId = await this.requireBelieverFree(table, input.believerId);
        const row = await this.rows.save(
            this.rows.create({
                tableId,
                data: JSON.stringify(data),
                believerId,
                createdBy: by,
            }),
        );
        return toRowView(row, columns);
    }

    async update(
        tableId: string,
        churchId: string,
        id: string,
        input: UpdateTableRowInput,
    ): Promise<CustomTableRowView> {
        const table = await this.requireTable(tableId, churchId);
        const columns = await this.activeColumnViews(tableId);
        const row = await this.require(tableId, id);
        requireNoBoundKeys(input.data, vinculadasDe(columns, table));

        const data = prepareRowData(
            columns.filter((one) => !one.believerField),
            input.data,
            parseRowData(row.data),
        );

        row.data = JSON.stringify(data);
        await this.rows.save(row);

        return toRowView(row, columns);
    }

    /**
     * Añadir creyentes en lote (RFC 0025 D7, D9): una fila por creyente, con
     * el JSON vacío — las columnas vinculadas nacen llenas al leer (D11) y las
     * a mano se rellan después. A quien ya está dentro se le salta, sin
     * fallar el lote entero.
     */
    async addBelievers(
        tableId: string,
        churchId: string,
        by: string,
        input: AddTableBelieversInput,
    ): Promise<number> {
        const table = await this.requireTable(tableId, churchId);
        if (table.source !== 'believers') {
            throw new BadRequestException('Esta tabla no está enlazada al listado de creyentes');
        }

        const believers = await this.believers.find({
            where: { id: In(input.believerIds), churchId: table.churchId },
        });
        if (believers.length !== new Set(input.believerIds).size) {
            throw new BadRequestException('Algún creyente no está en el listado de esta iglesia');
        }

        const dentro = await this.rows.find({
            where: { tableId, believerId: In(input.believerIds) },
        });
        const yaEstan = new Set(dentro.map((one) => one.believerId));
        const nuevos = believers.filter((one) => !yaEstan.has(one.id));
        if (nuevos.length === 0) return 0;

        const creadas = await this.rows.save(
            nuevos.map((one) =>
                this.rows.create({
                    tableId,
                    data: JSON.stringify({}),
                    believerId: one.id,
                    createdBy: by,
                }),
            ),
        );
        return creadas.length;
    }

    /** Los identificadores de los creyentes ya enlazados a la tabla, para el selector (D9). */
    async listBelieverIds(tableId: string, churchId: string): Promise<string[]> {
        await this.requireTable(tableId, churchId);
        const filas = await this.rows.find({
            where: { tableId, believerId: Not(IsNull()) },
            select: { believerId: true },
        });
        return filas.map((one) => one.believerId).filter((one): one is string => !!one);
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

    private async requireTable(tableId: string, churchId: string): Promise<CustomTable> {
        const table = await this.tables.findOne({ where: { id: tableId, churchId } });
        if (!table) throw new NotFoundException('Esa tabla no existe en esta iglesia');
        return table;
    }

    /**
     * Con el enlace puesto, una fila nueva exige su creyente y que no esté ya
     * dentro (D9, D13); sin enlace, un `believerId` suelto se rechaza (D13).
     */
    private async requireBelieverFree(
        table: CustomTable,
        believerId: string | undefined,
    ): Promise<string | null> {
        if (table.source !== 'believers') {
            if (believerId !== undefined)
                throw new BadRequestException('Esta tabla no está enlazada a creyentes');
            return null;
        }
        if (!believerId)
            throw new BadRequestException(
                'Con la tabla enlazada, una fila es de un creyente del listado',
            );

        const believer = await this.believers.findOne({
            where: { id: believerId, churchId: table.churchId },
        });
        if (!believer) throw new BadRequestException('Ese creyente no está en esta iglesia');

        const dentro = await this.rows.exists({ where: { tableId: table.id, believerId } });
        if (dentro) throw new BadRequestException('Ese creyente ya está en la tabla');

        return believerId;
    }

    private async activeColumnViews(tableId: string) {
        return (await this.columns.listActive(tableId)).map(toColumnView);
    }
}

/** Las columnas vinculadas que el cuerpo de una petición no puede tocar (D13). */
function vinculadasDe(
    columns: readonly { key: string; believerField: string | null }[],
    table: CustomTable,
): readonly string[] {
    if (table.source !== 'believers') return [];
    return columns.filter((one) => one.believerField !== null).map((one) => one.key);
}

/** Escribir en una celda vinculada se rechaza con 400, no se ignora (D13). */
function requireNoBoundKeys(data: Record<string, unknown>, vinculadas: readonly string[]): void {
    const tocada = Object.keys(data).find((key) => vinculadas.includes(key));
    if (tocada) {
        throw new BadRequestException(
            'Esa columna se rellena desde la ficha del creyente y no se edita a mano',
        );
    }
}
