import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MAX_TABLE_COLUMNS,
  toSlug,
  type CreateTableColumnInput,
  type UpdateTableColumnInput,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { CustomTableColumn } from './custom-table-column.entity';
import { freeOptionValues } from './table-column-options';

/**
 * Las columnas de una tabla personalizada (RFC 0021, «Las columnas»).
 *
 * `key` se genera una vez, al crear, y no cambia al renombrar (D7): es la
 * clave con la que se guarda el valor dentro del JSON de cada fila.
 */
@Injectable()
export class TableColumnsService {
  constructor(
    @InjectRepository(CustomTableColumn) private readonly columns: Repository<CustomTableColumn>,
  ) {}

  listActive(tableId: string): Promise<CustomTableColumn[]> {
    return this.columns.find({
      where: { tableId, isActive: true },
      order: { position: 'ASC' },
    });
  }

  async create(tableId: string, input: CreateTableColumnInput): Promise<CustomTableColumn> {
    const activas = await this.listActive(tableId);
    if (activas.length >= MAX_TABLE_COLUMNS) {
      throw new BadRequestException(
        `Una tabla no lleva más de ${String(MAX_TABLE_COLUMNS)} columnas`,
      );
    }

    return this.columns.save(
      this.columns.create({
        tableId,
        key: await this.freeKey(tableId, input.label),
        label: input.label,
        type: input.type,
        required: input.required ?? false,
        options: input.options ? JSON.stringify(freeOptionValues(input.options)) : null,
        config: input.config ? JSON.stringify(input.config) : null,
        position: activas.length,
        isActive: true,
      }),
    );
  }

  /** Cambiar el tipo o las opciones no toca ni una fila de datos (D9). */
  async update(
    tableId: string,
    id: string,
    input: UpdateTableColumnInput,
  ): Promise<CustomTableColumn> {
    const column = await this.require(tableId, id);

    if (input.label !== undefined) column.label = input.label;
    if (input.type !== undefined) column.type = input.type;
    if (input.required !== undefined) column.required = input.required;
    if (input.options !== undefined)
      column.options = JSON.stringify(freeOptionValues(input.options));
    if (input.config !== undefined) column.config = JSON.stringify(input.config);

    return this.columns.save(column);
  }

  /** Borrado lógico (D10): el valor sigue en el JSON de cada fila, sin mostrarse. */
  async remove(tableId: string, id: string): Promise<void> {
    const column = await this.require(tableId, id);
    column.isActive = false;
    await this.columns.save(column);
  }

  async reorder(tableId: string, columnIds: readonly string[]): Promise<CustomTableColumn[]> {
    const activas = await this.listActive(tableId);
    const known = new Set(activas.map((one) => one.id));
    const ordenados = columnIds.filter((id) => known.has(id));

    await Promise.all(
      ordenados.map((id, position) => this.columns.update({ id, tableId }, { position })),
    );

    return this.listActive(tableId);
  }

  async require(tableId: string, id: string): Promise<CustomTableColumn> {
    const column = await this.columns.findOne({ where: { id, tableId, isActive: true } });
    if (!column) throw new NotFoundException('Esa columna no existe en esta tabla');
    return column;
  }

  /** Que todas esas claves de columna sean columnas activas de la tabla, o 400. */
  async requireKeys(tableId: string, keys: readonly string[]): Promise<void> {
    const unicas = [...new Set(keys)];
    if (unicas.length === 0) return;

    const found = await this.columns.count({
      where: { tableId, isActive: true, key: In(unicas) },
    });
    if (found !== unicas.length)
      throw new BadRequestException('Alguna columna del filtro no existe');
  }

  private async freeKey(tableId: string, label: string): Promise<string> {
    const base = toSlug(label, 60) || 'columna';

    for (let intento = 1; ; intento += 1) {
      const key = intento === 1 ? base : `${base}-${String(intento)}`;
      if (!(await this.columns.exists({ where: { tableId, key } }))) return key;
    }
  }
}
