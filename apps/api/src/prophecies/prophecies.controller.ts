import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  ExportResponse,
  Paginated,
  PropheciesStats,
  Prophecy as ProphecyView,
  ProphecyExportRow,
  ProphecyListItem,
} from '@navis/shared';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PropheciesExportQueryDto } from './dto/prophecies-export.dto';
import { PropheciesQueryDto } from './dto/prophecies-query.dto';
import { CreateProphecyDto, UpdateProphecyDto } from './dto/prophecy.dto';
import { PropheciesExportService } from './prophecies-export.service';
import { PropheciesPageService } from './prophecies-page.service';
import { toProphecyView } from './prophecies.mapper';
import { PropheciesService } from './prophecies.service';
import { ProphecyStatsService } from './prophecy-stats.service';

/**
 * Las profecías de quien ha entrado (RFC 0004).
 *
 * **Sin `ActiveChurchGuard` y sin `@RequirePermissions`, a propósito** (D1, D2):
 * esto no es de la iglesia, es de cada usuario. La autorización es una sola
 * regla —eres el dueño o no lo eres— y vive en `PropheciesRepository`, que
 * exige el `ownerId` en todos sus métodos.
 *
 * El `ownerId` sale siempre de la sesión, nunca del cuerpo ni de la URL.
 */
@ApiTags('profecias')
@Controller('prophecies')
export class PropheciesController {
  constructor(
    private readonly prophecies: PropheciesService,
    private readonly page: PropheciesPageService,
    private readonly stats: ProphecyStatsService,
    private readonly exports: PropheciesExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Las mías, paginadas y filtradas' })
  @ApiOkResponse({ description: 'Listado paginado' })
  list(
    @CurrentUser('id') ownerId: string,
    @Query() query: PropheciesQueryDto,
  ): Promise<Paginated<ProphecyListItem>> {
    return this.page.list(ownerId, query);
  }

  /* Antes de `:id`, o «stats» se leería como un identificador. */
  @Get('stats')
  @ApiOperation({ summary: 'Las cuentas de la portada' })
  summary(@CurrentUser('id') ownerId: string): Promise<PropheciesStats> {
    return this.stats.stats(ownerId);
  }

  /* Antes de `:id`, por lo mismo que `stats`. Va filtrado por dueño como todo
     lo de aquí, y por eso el e2e que intenta exportar lo de otro devuelve una
     lista vacía y no un 403 (RFC 0009 D12). */
  @Get('export')
  @ApiOperation({ summary: 'Las mías sin paginar, para exportarlas' })
  export(
    @CurrentUser('id') ownerId: string,
    @Query() query: PropheciesExportQueryDto,
  ): Promise<ExportResponse<ProphecyExportRow>> {
    return this.exports.export(ownerId, { ...query, search: query.search || undefined });
  }

  @Post()
  @ApiOperation({ summary: 'Apunta una palabra' })
  async create(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateProphecyDto,
  ): Promise<ProphecyView> {
    return toProphecyView(await this.prophecies.create(ownerId, dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'La ficha, con sus cumplimientos' })
  async get(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<ProphecyView> {
    return toProphecyView(await this.prophecies.get(ownerId, id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita, incluido marcarla como cumplida' })
  async update(
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProphecyDto,
  ): Promise<ProphecyView> {
    return toProphecyView(await this.prophecies.update(ownerId, id, dto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico' })
  remove(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<void> {
    return this.prophecies.remove(ownerId, id);
  }
}
