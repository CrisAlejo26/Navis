import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type {
  CalendarRange,
  CalendarSummary,
  Meeting as MeetingView,
  Preacher,
} from '@navis/shared';

import { CurrentChurch } from '../common/decorators/current-church.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { ActiveChurchGuard } from '../common/guards/active-church.guard';
import { AssignmentsService } from './assignments.service';
import { CalendarsService } from './calendars.service';
import { AssignSlotDto } from './dto/assign-slot.dto';
import { CreateMeetingDto, SetSlotsDto, UpdateMeetingDto } from './dto/meeting.dto';
import { PreachersQueryDto } from './dto/preachers-query.dto';
import { RangeQueryDto } from './dto/range-query.dto';
import { MeetingsService } from './meetings.service';
import { PreachersService } from './preachers.service';
import { ScheduleService } from './schedule.service';
import { SummaryService } from './summary.service';

/**
 * La programación de **un calendario** (RFC 0002). Todo cuelga de
 * `/calendars/:calendarId`, y la iglesia la pone el servidor: el cliente elige
 * el calendario y la sede, nunca la iglesia.
 */
@ApiTags('calendario')
@Controller('calendars/:calendarId')
@UseGuards(ActiveChurchGuard)
export class ScheduleController {
  constructor(
    private readonly schedule: ScheduleService,
    private readonly meetings: MeetingsService,
    private readonly assignments: AssignmentsService,
    private readonly preachers: PreachersService,
    private readonly summaries: SummaryService,
    private readonly calendars: CalendarsService,
  ) {}

  @Get('schedule')
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'El tramo, con las reuniones fijas ya expandidas' })
  @ApiOkResponse({ description: 'Días con sus reuniones, reales o propuestas' })
  async range(
    @CurrentChurch() churchId: string,
    @Param('calendarId') calendarId: string,
    @Query() query: RangeQueryDto,
  ): Promise<CalendarRange> {
    const calendar = await this.calendars.require(churchId, calendarId);
    return this.schedule.range(churchId, {
      ...query,
      calendarId: calendar.id,
      congregationIds: query.congregation,
    });
  }

  @Put('slots')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Pone a alguien en una fase; materializa la reunión si hace falta' })
  async assign(
    @CurrentChurch() churchId: string,
    @Param('calendarId') calendarId: string,
    @Body() dto: AssignSlotDto,
  ): Promise<MeetingView> {
    await this.calendars.require(churchId, calendarId);
    return this.assignments.assign(churchId, dto);
  }

  @Post('meetings')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Una reunión puntual, sin reunión fija detrás' })
  async createMeeting(
    @CurrentChurch() churchId: string,
    @Param('calendarId') calendarId: string,
    @Body() dto: CreateMeetingDto,
  ): Promise<MeetingView> {
    const calendar = await this.calendars.require(churchId, calendarId);
    return this.meetings.create(churchId, calendar.id, dto);
  }

  @Patch('meetings/:id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Hora, nombre, notas, sede o cancelación' })
  updateMeeting(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ): Promise<MeetingView> {
    return this.meetings.update(churchId, id, dto);
  }

  @Put('meetings/:id/slots')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Reemplaza la lista de fases: añadir, quitar y reordenar' })
  setSlots(
    @CurrentChurch() churchId: string,
    @Param('id') id: string,
    @Body() dto: SetSlotsDto,
  ): Promise<MeetingView> {
    return this.meetings.setSlots(churchId, id, dto);
  }

  @Delete('meetings/:id')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Borrado lógico; si nació de una reunión fija, vuelve a propuesta' })
  removeMeeting(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.meetings.remove(churchId, id);
  }

  @Get('preachers')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Candidatos del ministerio de este calendario' })
  async listPreachers(
    @CurrentChurch() churchId: string,
    @Param('calendarId') calendarId: string,
    @Query() query: PreachersQueryDto,
  ): Promise<Preacher[]> {
    const calendar = await this.calendars.require(churchId, calendarId);
    return this.preachers.list(churchId, {
      ...query,
      calendarId: calendar.id,
      ministry: calendar.ministry,
    });
  }

  @Get('summary')
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Reparto del tramo y avisos' })
  async summary(
    @CurrentChurch() churchId: string,
    @Param('calendarId') calendarId: string,
    @Query() query: RangeQueryDto,
  ): Promise<CalendarSummary> {
    const calendar = await this.calendars.require(churchId, calendarId);
    return this.summaries.summary(churchId, {
      ...query,
      calendarId: calendar.id,
      congregationIds: query.congregation,
    });
  }
}
