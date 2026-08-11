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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  ExportResponse,
  JournalEntry as JournalEntryView,
  JournalEntryListItem,
  JournalExportRow,
  JournalStats,
  Paginated,
} from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateEntryDto, UpdateEntryDto } from './dto/journal-entry.dto';
import { JournalExportQueryDto } from './dto/journal-export.dto';
import { JournalQueryDto } from './dto/journal-query.dto';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntriesViewService } from './journal-entries-view.service';
import { JournalExportService } from './journal-export.service';
import { JournalPageService } from './journal-page.service';
import { JournalStatsService } from './journal-stats.service';

/**
 * El cuaderno de la iglesia (RFC 0017 §6).
 *
 * `stats` y `export` van declarados antes de `:id`, o Nest los leería como un
 * identificador. Todo bajo `ActiveChurchGuard` (D1): una entrada es de la
 * iglesia activa, no de quien la escribe.
 */
@ApiTags('cuaderno')
@Controller('journal')
@UseGuards(ActiveChurchGuard)
export class JournalController {
  constructor(
    private readonly entries: JournalEntriesService,
    private readonly page: JournalPageService,
    private readonly stats: JournalStatsService,
    private readonly exports: JournalExportService,
    private readonly view: JournalEntriesViewService,
  ) {}

  @Get()
  @RequirePermissions('journal.view')
  @ApiOperation({ summary: 'El listado, paginado, filtrado y buscable' })
  @ApiOkResponse({ description: 'Página de entradas' })
  list(
    @CurrentChurch() churchId: string,
    @Query() query: JournalQueryDto,
  ): Promise<Paginated<JournalEntryListItem>> {
    return this.page.list(churchId, query);
  }

  @Get('stats')
  @RequirePermissions('journal.view')
  @ApiOperation({ summary: 'Las cuentas de la portada' })
  summary(@CurrentChurch() churchId: string): Promise<JournalStats> {
    return this.stats.stats(churchId);
  }

  @Get('export')
  @RequirePermissions('journal.view')
  @ApiOperation({ summary: 'Filas completas del filtro, para exportarlas a Markdown' })
  export(
    @CurrentChurch() churchId: string,
    @Query() query: JournalExportQueryDto,
  ): Promise<ExportResponse<JournalExportRow>> {
    return this.exports.export(churchId, { ...query, search: query.search || undefined });
  }

  @Post()
  @RequirePermissions('journal.manage')
  @ApiOperation({ summary: 'Añade una entrada' })
  async create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateEntryDto,
    @CurrentUser('id') authorId: string | undefined,
  ): Promise<JournalEntryView> {
    const entry = await this.entries.create(
      churchId,
      {
        ...dto,
        learned: dto.learned ?? undefined,
        remindAt: dto.remindAt ?? undefined,
        remindText: dto.remindText ?? undefined,
      },
      authorId ?? null,
    );

    return this.view.one(entry);
  }

  @Get(':id')
  @RequirePermissions('journal.view')
  @ApiOperation({ summary: 'La ficha, con sus audios' })
  async get(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<JournalEntryView> {
    return this.view.one(await this.entries.require(churchId, id));
  }

  @Patch(':id')
  @RequirePermissions('journal.manage')
  @ApiOperation({ summary: 'Edita una entrada, incluido el recordatorio' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEntryDto,
  ): Promise<JournalEntryView> {
    return this.view.one(await this.entries.update(churchId, id, dto));
  }

  @Delete(':id')
  @RequirePermissions('journal.manage')
  @ApiOperation({ summary: 'Borrado lógico' })
  async remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    await this.entries.remove(churchId, id);
  }
}
