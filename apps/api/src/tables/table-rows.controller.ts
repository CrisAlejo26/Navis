import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CustomTableRow as CustomTableRowView, Paginated } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateTableRowDto, UpdateTableRowDto } from './dto/table-row.dto';
import { TableRowsQueryDto } from './dto/table-rows-query.dto';
import { TableRowsService } from './table-rows.service';
import { TablesService } from './tables.service';

/**
 * Las filas de una tabla personalizada (RFC 0021, «Las filas»).
 *
 * `tables.view` basta para leer y para revelar una contraseña: quien ya ve la
 * tabla puede ver esa celda (D22). Añadir, editar y borrar filas piden
 * `tables.edit`.
 */
@ApiTags('tablas')
@Controller('tables')
@UseGuards(ActiveChurchGuard)
export class TableRowsController {
  constructor(
    private readonly tables: TablesService,
    private readonly rows: TableRowsService,
  ) {}

  @Get(':id/rows')
  @RequirePermissions('tables.view')
  @ApiOperation({ summary: 'Página de filas: page, limit, sort, order, search, filters (D30)' })
  async list(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Query() query: TableRowsQueryDto,
  ): Promise<Paginated<CustomTableRowView>> {
    await this.tables.require(churchId, id);
    return this.rows.findPage(id, query);
  }

  @Post(':id/rows')
  @RequirePermissions('tables.edit')
  @ApiOperation({ summary: 'Añade una fila' })
  async create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateTableRowDto,
  ): Promise<CustomTableRowView> {
    await this.tables.require(churchId, id);
    return this.rows.create(id, userId, dto);
  }

  @Patch(':id/rows/:rid')
  @RequirePermissions('tables.edit')
  @ApiOperation({ summary: 'Edita una fila' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('rid') rid: string,
    @Body() dto: UpdateTableRowDto,
  ): Promise<CustomTableRowView> {
    await this.tables.require(churchId, id);
    return this.rows.update(id, rid, dto);
  }

  @Delete(':id/rows/:rid')
  @RequirePermissions('tables.edit')
  @ApiOperation({ summary: 'Borrado lógico de la fila' })
  async remove(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('rid') rid: string,
  ): Promise<void> {
    await this.tables.require(churchId, id);
    await this.rows.remove(id, rid);
  }

  @Get(':id/rows/:rid/reveal/:columnKey')
  @RequirePermissions('tables.view')
  @ApiOperation({ summary: 'El texto claro de una celda de tipo contraseña (D22)' })
  async reveal(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('rid') rid: string,
    @Param('columnKey') columnKey: string,
  ): Promise<{ value: string }> {
    await this.tables.require(churchId, id);
    return { value: await this.rows.reveal(id, rid, columnKey) };
  }
}
