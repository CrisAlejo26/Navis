import { Body, Controller, Delete, Param, Patch, Post, Put, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CustomTableColumn as CustomTableColumnView } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import {
  CreateTableColumnDto,
  ReorderTableColumnsDto,
  UpdateTableColumnDto,
} from './dto/table-column.dto';
import { TableColumnsService } from './table-columns.service';
import { toColumnView } from './tables.mapper';
import { TablesService } from './tables.service';

/** Las columnas de una tabla personalizada (RFC 0021, «Las columnas»). */
@ApiTags('tablas')
@Controller('tables')
@UseGuards(ActiveChurchGuard)
@RequirePermissions('tables.manage')
export class TableColumnsController {
  constructor(
    private readonly tables: TablesService,
    private readonly columns: TableColumnsService,
  ) {}

  @Post(':id/columns')
  @ApiOperation({ summary: 'Añade una columna' })
  async create(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: CreateTableColumnDto,
  ): Promise<CustomTableColumnView> {
    await this.tables.require(churchId, id);
    return toColumnView(await this.columns.create(id, dto));
  }

  @Patch(':id/columns/:cid')
  @ApiOperation({ summary: 'Renombra, cambia tipo u opciones (D9)' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('cid') cid: string,
    @Body() dto: UpdateTableColumnDto,
  ): Promise<CustomTableColumnView> {
    await this.tables.require(churchId, id);
    return toColumnView(await this.columns.update(id, cid, dto));
  }

  @Put(':id/columns/order')
  @ApiOperation({ summary: 'El orden entero, de una vez (D8)' })
  async reorder(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: ReorderTableColumnsDto,
  ): Promise<CustomTableColumnView[]> {
    await this.tables.require(churchId, id);
    return (await this.columns.reorder(id, dto.columnIds)).map(toColumnView);
  }

  @Delete(':id/columns/:cid')
  @ApiOperation({ summary: 'Borrado lógico de la columna (D10)' })
  async remove(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('cid') cid: string,
  ): Promise<void> {
    await this.tables.require(churchId, id);
    await this.columns.remove(id, cid);
  }
}
