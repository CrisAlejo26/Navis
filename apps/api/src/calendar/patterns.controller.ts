import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CreatePatternDto, UpdatePatternDto } from './dto/pattern.dto';
import type { MeetingPattern } from './meeting-pattern.entity';
import { PatternsService } from './patterns.service';

/**
 * Los patrones semanales. Editar uno **no** reescribe las reuniones que ya se
 * habían tocado (D7): eso son decisiones tomadas.
 */
@ApiTags('calendario')
@Controller('calendar/patterns')
@UseGuards(ActiveChurchGuard)
export class PatternsController {
  constructor(private readonly patterns: PatternsService) {}

  @Get()
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Los patrones de la iglesia, por sede' })
  @ApiOkResponse({ description: 'Listado de patrones con sus fases' })
  list(@CurrentChurch() churchId: string): Promise<MeetingPattern[]> {
    return this.patterns.list(churchId);
  }

  @Post()
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Crea un patrón con sus fases' })
  create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreatePatternDto,
  ): Promise<MeetingPattern> {
    return this.patterns.create(churchId, dto);
  }

  @Patch(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Edita el patrón o sus fases' })
  update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePatternDto,
  ): Promise<MeetingPattern> {
    return this.patterns.update(churchId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Borrado lógico; las reuniones ya creadas se quedan' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.patterns.remove(churchId, id);
  }
}
