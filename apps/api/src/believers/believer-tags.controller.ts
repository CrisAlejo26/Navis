import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { BelieverTag as BelieverTagView } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { toBelieverTagView } from './believers.mapper';
import { BelieverTagsService } from './believer-tags.service';
import { CreateBelieverTagDto, UpdateBelieverTagDto } from './dto/believer-tag.dto';

/**
 * El catálogo de **etiquetas de creyente** de la iglesia activa.
 *
 * Cuelga de los permisos `believers.*` y no de un módulo propio, como dones y
 * labores: una etiqueta es parte de la ficha de una persona, no una sección
 * aparte. No colisiona con `GET /tags` (etiquetas de tareas, RFC 0018): esa
 * vive en `tasks`, es de cada cuenta y va con sus propios permisos.
 */
@ApiTags('creyentes')
@Controller('believer-tags')
@UseGuards(ActiveChurchGuard)
export class BelieverTagsController {
  constructor(private readonly tags: BelieverTagsService) {}

  @Get()
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'El catálogo, en su orden' })
  @ApiOkResponse({ description: 'Listado de etiquetas de creyente' })
  async list(@CurrentChurch() churchId: string): Promise<BelieverTagView[]> {
    return (await this.tags.list(churchId)).map(toBelieverTagView);
  }

  @Post()
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Añade una etiqueta al catálogo' })
  async create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateBelieverTagDto,
  ): Promise<BelieverTagView> {
    return toBelieverTagView(await this.tags.create(churchId, dto));
  }

  @Patch(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Renombra, recolorea, activa o desactiva' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBelieverTagDto,
  ): Promise<BelieverTagView> {
    return toBelieverTagView(await this.tags.update(churchId, id, dto));
  }

  @Delete(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Borra una etiqueta del catálogo' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.tags.remove(churchId, id);
  }
}
