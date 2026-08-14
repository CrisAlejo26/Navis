import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { CustomTable as CustomTableView, CustomTableWithColumns } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateCustomTableDto, UpdateCustomTableDto } from './dto/table.dto';
import { TableColumnsService } from './table-columns.service';
import { toColumnView, toCustomTableView } from './tables.mapper';
import { TablesService } from './tables.service';

/** Las tablas personalizadas de la iglesia (RFC 0021). */
@ApiTags('tablas')
@Controller('tables')
@UseGuards(ActiveChurchGuard)
export class TablesController {
  constructor(
    private readonly tables: TablesService,
    private readonly columns: TableColumnsService,
  ) {}

  @Get()
  @RequirePermissions('tables.view')
  @ApiOperation({ summary: 'Las tablas de la iglesia' })
  async list(@CurrentChurch() churchId: string): Promise<CustomTableView[]> {
    return (await this.tables.list(churchId)).map(toCustomTableView);
  }

  @Post()
  @RequirePermissions('tables.manage')
  @ApiOperation({ summary: 'Crea una tabla, vacía' })
  async create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCustomTableDto,
  ): Promise<CustomTableView> {
    return toCustomTableView(await this.tables.create(churchId, dto, userId));
  }

  @Get(':id')
  @RequirePermissions('tables.view')
  @ApiOperation({ summary: 'La ficha, con sus columnas activas' })
  async get(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
  ): Promise<CustomTableWithColumns> {
    const table = await this.tables.require(churchId, id);
    const columns = await this.columns.listActive(id);

    return { ...toCustomTableView(table), columns: columns.map(toColumnView) };
  }

  @Patch(':id')
  @RequirePermissions('tables.manage')
  @ApiOperation({ summary: 'Nombre, icono, color o estado' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomTableDto,
  ): Promise<CustomTableView> {
    return toCustomTableView(await this.tables.update(churchId, id, dto));
  }

  @Delete(':id')
  @RequirePermissions('tables.manage')
  @ApiOperation({ summary: 'Borrado lógico' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.tables.remove(churchId, id);
  }
}
