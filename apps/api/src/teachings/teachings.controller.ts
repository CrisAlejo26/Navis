import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  Paginated,
  Teaching as TeachingView,
  TeachingListItem,
  TeachingsStats,
} from '@navis/shared';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTeachingDto, UpdateTeachingDto } from './dto/teaching.dto';
import { TeachingsQueryDto } from './dto/teachings-query.dto';
import { toTeachingView } from './teachings.mapper';
import { TeachingsPageService } from './teachings-page.service';
import { TeachingsService } from './teachings.service';
import { TeachingStatsService } from './teaching-stats.service';

/**
 * Las enseñanzas de quien ha entrado (RFC 0022).
 *
 * **Sin `ActiveChurchGuard` y sin `@RequirePermissions`, a propósito**: esto
 * no es de la iglesia, es de cada usuario (mismo modelo que RFC 0004 D1/D2).
 * La autorización vive en `TeachingsRepository`, que exige el `ownerId` en
 * todos sus métodos.
 */
@ApiTags('enseñanzas')
@Controller('teachings')
export class TeachingsController {
  constructor(
    private readonly teachings: TeachingsService,
    private readonly page: TeachingsPageService,
    private readonly stats: TeachingStatsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Las mías, paginadas y con búsqueda' })
  @ApiOkResponse({ description: 'Listado paginado' })
  list(
    @CurrentUser('id') ownerId: string,
    @Query() query: TeachingsQueryDto,
  ): Promise<Paginated<TeachingListItem>> {
    return this.page.list(ownerId, query);
  }

  /* Antes de `:id`, o «stats» se leería como un identificador. */
  @Get('stats')
  @ApiOperation({ summary: 'Las cuentas de la portada' })
  summary(@CurrentUser('id') ownerId: string): Promise<TeachingsStats> {
    return this.stats.stats(ownerId);
  }

  @Post()
  @ApiOperation({ summary: 'Anota una enseñanza' })
  async create(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateTeachingDto,
  ): Promise<TeachingView> {
    return toTeachingView(await this.teachings.create(ownerId, dto));
  }

  @Get(':id')
  @ApiOperation({ summary: 'La ficha, con el texto entero' })
  async get(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<TeachingView> {
    return toTeachingView(await this.teachings.get(ownerId, id));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita el título, el cuerpo o la fecha' })
  async update(
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTeachingDto,
  ): Promise<TeachingView> {
    return toTeachingView(await this.teachings.update(ownerId, id, dto));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico' })
  remove(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<void> {
    return this.teachings.remove(ownerId, id);
  }
}
