import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { CalendarsService } from './calendars.service';
import { CreatePatternDto, UpdatePatternDto } from './dto/pattern.dto';
import type { MeetingPattern } from './meeting-pattern.entity';
import { PatternsService } from './patterns.service';

/**
 * Las reuniones fijas de **un calendario**. Editar uno **no** reescribe las reuniones que ya se
 * habían tocado (D7): eso son decisiones tomadas.
 */
@ApiTags('calendario')
@Controller('calendars/:calendarId/patterns')
@UseGuards(ActiveChurchGuard)
export class PatternsController {
  constructor(
    private readonly patterns: PatternsService,
    private readonly calendars: CalendarsService,
  ) {}

  @Get()
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Los patrones de la iglesia, por sede' })
  @ApiOkResponse({ description: 'Listado de patrones con sus fases' })
  async list(
    @CurrentChurch() churchId: string,
    @Param('calendarId') calendarId: string,
  ): Promise<MeetingPattern[]> {
    const calendar = await this.calendars.require(churchId, calendarId);
    return this.patterns.list(churchId, calendar.id);
  }

  @Post()
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Crea un patrón con sus fases' })
  async create(
    @CurrentChurch() churchId: string,
    @Param('calendarId') calendarId: string,
    @Body() dto: CreatePatternDto,
  ): Promise<MeetingPattern> {
    const calendar = await this.calendars.require(churchId, calendarId);
    return this.patterns.create(churchId, calendar.id, dto);
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
