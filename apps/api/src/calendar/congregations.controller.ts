import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import type { Congregation } from './congregation.entity';
import { CongregationsService } from './congregations.service';
import { CreateCongregationDto, UpdateCongregationDto } from './dto/congregation.dto';

/**
 * Las sedes de la iglesia activa. Se leen con `calendar.view` —hacen falta
 * para pintar el calendario— y se tocan con `calendar.manage`.
 */
@ApiTags('calendario')
@Controller('calendar/congregations')
@UseGuards(ActiveChurchGuard)
export class CongregationsController {
  constructor(private readonly congregations: CongregationsService) {}

  @Get()
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Las sedes, en su orden' })
  @ApiOkResponse({ description: 'Listado de sedes' })
  list(@CurrentChurch() churchId: string): Promise<Congregation[]> {
    return this.congregations.ensureFor(churchId);
  }

  @Post()
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Crea una sede: nombre y color' })
  create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateCongregationDto,
  ): Promise<Congregation> {
    return this.congregations.create(churchId, dto);
  }

  @Patch(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Edita o apaga una sede' })
  update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCongregationDto,
  ): Promise<Congregation> {
    return this.congregations.update(churchId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Borrado lógico; nunca la última' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.congregations.remove(churchId, id);
  }
}
