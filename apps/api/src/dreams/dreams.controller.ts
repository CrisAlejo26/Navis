import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Dream as DreamView, DreamListItem, DreamsStats, Paginated } from '@navis/shared';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DreamStatsService } from './dream-stats.service';
import { DreamsPageService } from './dreams-page.service';
import { DreamsService } from './dreams.service';
import { CreateDreamDto, UpdateDreamDto } from './dto/dream.dto';
import { DreamsQueryDto } from './dto/dreams-query.dto';

/**
 * Los sueños de quien ha entrado (RFC 0005).
 *
 * **Sin `ActiveChurchGuard` y sin `@RequirePermissions`, a propósito** (D1, D2):
 * esto no es de la iglesia, es de cada usuario. La autorización es una sola
 * regla —eres el dueño o no lo eres— y vive en `DreamsRepository`, que exige el
 * `ownerId` en todos sus métodos.
 *
 * El `ownerId` sale siempre de la sesión, nunca del cuerpo ni de la URL.
 */
@ApiTags('suenos')
@Controller('dreams')
export class DreamsController {
  constructor(
    private readonly dreams: DreamsService,
    private readonly page: DreamsPageService,
    private readonly stats: DreamStatsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Los míos, paginados y filtrados' })
  @ApiOkResponse({ description: 'Listado paginado' })
  list(
    @CurrentUser('id') ownerId: string,
    @Query() query: DreamsQueryDto,
  ): Promise<Paginated<DreamListItem>> {
    return this.page.list(ownerId, query);
  }

  /* Antes de `:id`, o «stats» se leería como un identificador. Lo mismo vale
     para `dreams/emotions`, que vive en otro controlador y por eso este módulo
     lo registra antes que a este (ver `dreams.module.ts`). */
  @Get('stats')
  @ApiOperation({ summary: 'Las cuentas de la portada' })
  summary(@CurrentUser('id') ownerId: string): Promise<DreamsStats> {
    return this.stats.stats(ownerId);
  }

  @Post()
  @ApiOperation({ summary: 'Apunta un sueño' })
  create(@CurrentUser('id') ownerId: string, @Body() dto: CreateDreamDto): Promise<DreamView> {
    return this.dreams.create(ownerId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'La ficha, con sus emociones y sus audios' })
  get(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<DreamView> {
    return this.dreams.get(ownerId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita, incluida la interpretación y el cumplimiento' })
  update(
    @CurrentUser('id') ownerId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDreamDto,
  ): Promise<DreamView> {
    return this.dreams.update(ownerId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Borrado lógico' })
  remove(@CurrentUser('id') ownerId: string, @Param('id') id: string): Promise<void> {
    return this.dreams.remove(ownerId, id);
  }
}
