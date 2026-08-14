import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChurchesModule } from '../churches/churches.module';
import { CustomTableColumn } from './custom-table-column.entity';
import { CustomTableRow } from './custom-table-row.entity';
import { CustomTableView } from './custom-table-view.entity';
import { CustomTable } from './custom-table.entity';
import { TableColumnsController } from './table-columns.controller';
import { TableColumnsService } from './table-columns.service';
import { TableExportController } from './table-export.controller';
import { TableRowsController } from './table-rows.controller';
import { TableRowsExportService } from './table-rows-export.service';
import { TableRowsPageService } from './table-rows-page.service';
import { TableRowsService } from './table-rows.service';
import { TableViewsController } from './table-views.controller';
import { TableViewsService } from './table-views.service';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

/** Las tablas personalizadas de la iglesia (RFC 0021). */
@Module({
  imports: [
    TypeOrmModule.forFeature([CustomTable, CustomTableColumn, CustomTableRow, CustomTableView]),
    ChurchesModule,
  ],
  controllers: [
    TablesController,
    TableColumnsController,
    TableRowsController,
    TableExportController,
    TableViewsController,
  ],
  providers: [
    TablesService,
    TableColumnsService,
    TableRowsService,
    TableRowsPageService,
    TableRowsExportService,
    TableViewsService,
  ],
})
export class TablesModule {}
