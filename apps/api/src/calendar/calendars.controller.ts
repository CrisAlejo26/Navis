import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import type { Calendar } from './calendar.entity';
import { CalendarsService } from './calendars.service';
import { CreateCalendarDto, UpdateCalendarDto } from './dto/calendar.dto';
import { WeekSeederService } from './week-seeder.service';

/**
 * Los calendarios de la iglesia: púlpito, recepción, sonido, biblias y los que
 * cada una añada (RFC 0002 D15). Son las subentradas de la barra lateral.
 */
@ApiTags('calendario')
@Controller('calendars')
@UseGuards(ActiveChurchGuard)
export class CalendarsController {
  constructor(
    private readonly calendars: CalendarsService,
    private readonly week: WeekSeederService,
  ) {}

  @Get()
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Los calendarios, en su orden' })
  @ApiOkResponse({ description: 'Listado de calendarios' })
  async list(@CurrentChurch() churchId: string): Promise<Calendar[]> {
    const existentes = await this.calendars.list(churchId);
    if (existentes.length > 0) return existentes;

    /*
     * Primera vez en esta iglesia: nacen los cuatro de serie, la sede de serie
     * si tampoco la había, y la semana en cada pareja. La comprobación va
     * antes a propósito —este endpoint se llama en cada carga de la
     * aplicación— para no repasar la siembra entera cada vez.
     */
    const { calendars } = await this.week.ensureScaffold(churchId);
    return calendars;
  }

  @Post()
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Crea un calendario' })
  async create(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateCalendarDto,
  ): Promise<Calendar> {
    const calendar = await this.calendars.create(churchId, dto);

    // Un calendario vacío no dice nada: nace con la semana de serie en cada
    // sede, y de ahí se ajusta (RFC 0002 §5.7).
    await this.week.seedCalendar(churchId, calendar.id);

    return calendar;
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
