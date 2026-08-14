import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { ExportResponse, RowData } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { TableExportQueryDto } from './dto/table-export-query.dto';
import { TableRowsExportService } from './table-rows-export.service';
import { TablesService } from './tables.service';

@ApiTags('tablas')
@Controller('tables')
@UseGuards(ActiveChurchGuard)
export class TableExportController {
  constructor(
    private readonly tables: TablesService,
    private readonly exports: TableRowsExportService,
  ) {}

  @Get(':id/export')
  @RequirePermissions('tables.view')
  @ApiOperation({ summary: 'Las filas, con la vista y los filtros activos (D23)' })
  async export(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Query() query: TableExportQueryDto,
  ): Promise<ExportResponse<RowData>> {
    await this.tables.require(churchId, id);
    return this.exports.export(id, query, query.includePasswords === 'true');
  }
}
