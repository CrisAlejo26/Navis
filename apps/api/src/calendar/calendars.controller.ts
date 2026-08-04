import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import type { Calendar } from './calendar.entity';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto, UpdateCalendarDto } from './dto/calendar.dto';

/**
 * Los calendarios de la iglesia: púlpito, recepción, sonido, biblias y los que
 * cada una añada (RFC 0002 D15). Son las subentradas de la barra lateral.
 */
@ApiTags('calendario')
@Controller('calendars')
@UseGuards(ActiveChurchGuard)
export class CalendarsController {
  constructor(private readonly calendars: CalendarsService) {}

  @Get()
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Los calendarios, en su orden' })
  @ApiOkResponse({ description: 'Listado de calendarios' })
  list(@CurrentChurch() churchId: string): Promise<Calendar[]> {
    return this.calendars.ensureFor(churchId);
  }

  @Post()
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Crea un calendario' })
  create(@CurrentChurch() churchId: string, @Body() dto: CreateCalendarDto): Promise<Calendar> {
    return this.calendars.create(churchId, dto);
  }

  @Patch(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Renombra o cambia el ministerio; el slug no cambia' })
  update(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCalendarDto,
  ): Promise<Calendar> {
    return this.calendars.update(churchId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Borrado lógico; nunca el último' })
  remove(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.calendars.remove(churchId, id);
  }
}
