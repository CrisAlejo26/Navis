import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MinistryCatalog } from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { toMinistryView } from './believers.mapper';
import { CreateMinistryDto, UpdateMinistryDto } from './dto/ministry.dto';
import { MinistriesService } from './ministries.service';

/**
 * El catálogo de **labores** de la iglesia activa.
 *
 * Cuelga de los permisos `believers.*` y no de un módulo propio, igual que los
 * dones: una labor es parte de la ficha de una persona, no una sección aparte.
 */
@ApiTags('creyentes')
@Controller('ministries')
@UseGuards(ActiveChurchGuard)
export class MinistriesController {
  constructor(private readonly ministries: MinistriesService) {}

  @Get()
  @RequirePermissions('believers.view')
  @ApiOperation({ summary: 'El catálogo, en su orden' })
  @ApiOkResponse({ description: 'Listado de labores' })
  async list(@CurrentChurch() churchId: string): Promise<MinistryCatalog[]> {
    return (await this.ministries.ensureFor(churchId)).map(toMinistryView);
  }

  @Post()
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Añade una labor al catálogo' })
  async create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateMinistryDto,
  ): Promise<MinistryCatalog> {
    return toMinistryView(await this.ministries.create(churchId, dto));
  }

  @Patch(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Renombra, recolorea, activa o desactiva. El slug no cambia' })
  async update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMinistryDto,
  ): Promise<MinistryCatalog> {
    return toMinistryView(await this.ministries.update(churchId, id, dto));
  }

  @Delete(':id')
  @RequirePermissions('believers.manage')
  @ApiOperation({ summary: 'Solo las que no son de serie; esas se desactivan' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.ministries.remove(churchId, id);
  }
}
