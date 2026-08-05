import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  ExportResponse,
  List as ListView,
  ListExportRow,
  ListMember as ListMemberView,
  ListMemberships,
  ListStats,
  ListSummary,
} from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreateListDto, UpdateListDto } from './dto/list.dto';
import { ListMembersService } from './list-members.service';
import { ListRowsService } from './list-rows.service';
import { ListStatsService } from './list-stats.service';
import { ListsExportService } from './lists-export.service';
import { ListsSummaryService } from './lists-summary.service';
import { ListsService } from './lists.service';
import { toListView } from './lists.mapper';

/**
 * Las listas de la iglesia (RFC 0010). Son las subentradas de la barra lateral,
 * igual que los calendarios.
 */
@ApiTags('listas')
@Controller('lists')
@UseGuards(ActiveChurchGuard)
export class ListsController {
  constructor(
    private readonly lists: ListsService,
    private readonly summaries: ListsSummaryService,
    private readonly rows: ListRowsService,
    private readonly members: ListMembersService,
    private readonly stats: ListStatsService,
    private readonly exports: ListsExportService,
  ) {}

  @Get()
  @RequirePermissions('lists.view')
  @ApiOperation({ summary: 'Las listas de la iglesia, con sus cuentas' })
  @ApiOkResponse({ description: 'El tablón' })
  async list(@CurrentChurch() churchId: string): Promise<ListSummary[]> {
    return this.summaries.of(await this.lists.ensureFor(churchId));
  }

  /*
   * Antes de `:id`, o «memberships» se leería como un identificador. Y exige
   * **los dos permisos**: sin `lists.view` no se enseñan los puntos en
   * creyentes, porque los nombres de las listas también son información.
   */
  @Get('memberships')
  @RequirePermissions('lists.view', 'believers.view')
  @ApiOperation({ summary: 'En qué listas está cada persona (§8.7)' })
  memberships(@CurrentChurch() churchId: string): Promise<ListMemberships> {
    return this.members.memberships(churchId);
  }

  @Post()
  @RequirePermissions('lists.manage')
  @ApiOperation({ summary: 'Crea una lista' })
  async create(
    @CurrentChurch() churchId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateListDto,
  ): Promise<ListView> {
    return toListView(await this.lists.create(churchId, dto, userId), 0);
  }

  @Get(':id')
  @RequirePermissions('lists.view')
  @ApiOperation({ summary: 'La ficha, con sus miembros ordenados' })
  async get(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
  ): Promise<ListView & { members: ListMemberView[] }> {
    const list = await this.lists.require(churchId, id);
    const members = await this.rows.view(id);

    return { ...toListView(list, members.length), members };
  }

  @Patch(':id')
  @RequirePermissions('lists.manage')
  @ApiOperation({ summary: 'Nombre, descripción, color o estado; el slug no cambia' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListDto,
  ): Promise<ListView> {
    const list = await this.lists.update(churchId, id, dto);
    return toListView(list, (await this.members.counts([id])).get(id) ?? 0);
  }

  @Delete(':id')
  @RequirePermissions('lists.manage')
  @ApiOperation({ summary: 'Borrado lógico. Despublica y quita las concesiones' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.lists.remove(churchId, id);
  }

  @Get(':id/stats')
  @RequirePermissions('lists.view')
  @ApiOperation({ summary: 'Composición, audiencia y solapamiento' })
  async summary(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<ListStats> {
    return this.stats.of(await this.lists.require(churchId, id));
  }

  @Get(':id/export')
  @RequirePermissions('lists.view')
  @ApiOperation({ summary: 'Las filas, según el RFC 0009' })
  async export(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
  ): Promise<ExportResponse<ListExportRow>> {
    await this.lists.require(churchId, id);
    return this.exports.export(id);
  }
}
