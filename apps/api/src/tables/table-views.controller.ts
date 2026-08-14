import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CustomTableView as CustomTableViewShape } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateTableViewDto, UpdateTableViewDto } from './dto/table-view.dto';
import { toViewShape } from './table-views.mapper';
import { TableViewsService } from './table-views.service';
import { TablesService } from './tables.service';

/** Las vistas guardadas de una tabla: tablero y calendario (RFC 0021 D24). */
@ApiTags('tablas')
@Controller('tables')
@UseGuards(ActiveChurchGuard)
export class TableViewsController {
  constructor(
    private readonly tables: TablesService,
    private readonly views: TableViewsService,
  ) {}

  @Get(':id/views')
  @RequirePermissions('tables.view')
  @ApiOperation({ summary: 'Las vistas guardadas de la tabla' })
  async list(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
  ): Promise<CustomTableViewShape[]> {
    await this.tables.require(churchId, id);
    return (await this.views.list(id)).map(toViewShape);
  }

  @Post(':id/views')
  @RequirePermissions('tables.manage')
  @ApiOperation({ summary: 'Crea una vista de tablero o calendario' })
  async create(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: CreateTableViewDto,
  ): Promise<CustomTableViewShape> {
    await this.tables.require(churchId, id);
    return toViewShape(await this.views.create(id, dto));
  }

  @Patch(':id/views/:vid')
  @RequirePermissions('tables.manage')
  @ApiOperation({ summary: 'Cambia nombre, filtros u orden de la vista' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('vid') vid: string,
    @Body() dto: UpdateTableViewDto,
  ): Promise<CustomTableViewShape> {
    await this.tables.require(churchId, id);
    return toViewShape(await this.views.update(id, vid, dto));
  }

  @Delete(':id/views/:vid')
  @RequirePermissions('tables.manage')
  @ApiOperation({ summary: 'Borra la vista (nunca la de cuadrícula, que no existe aquí)' })
  async remove(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Param('vid') vid: string,
  ): Promise<void> {
    await this.tables.require(churchId, id);
    await this.views.remove(id, vid);
  }
}
