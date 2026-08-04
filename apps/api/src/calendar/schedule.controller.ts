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
import { CalendarService } from './calendar.service';
import { AssignSlotDto } from './dto/assign-slot.dto';
import { CreateMeetingDto, SetSlotsDto, UpdateMeetingDto } from './dto/meeting.dto';
import { PreachersQueryDto } from './dto/preachers-query.dto';
import { RangeQueryDto } from './dto/range-query.dto';
import { MeetingsService } from './meetings.service';
import { PreachersService } from './preachers.service';
import { SummaryService } from './summary.service';

/**
 * El calendario de programaciones (RFC 0002). Todo va acotado a la iglesia
 * activa, que pone el servidor: el cliente elige la **sede**, nunca la iglesia.
 */
@ApiTags('calendario')
@Controller('calendar')
@UseGuards(ActiveChurchGuard)
export class CalendarController {
  constructor(
    private readonly calendar: CalendarService,
    private readonly meetings: MeetingsService,
    private readonly assignments: AssignmentsService,
    private readonly preachers: PreachersService,
    private readonly summaries: SummaryService,
  ) {}

  @Get()
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'El tramo, con los patrones ya expandidos' })
  @ApiOkResponse({ description: 'Días con sus reuniones, reales o propuestas' })
  range(@CurrentChurch() churchId: string, @Query() query: RangeQueryDto): Promise<CalendarRange> {
    return this.calendar.range(churchId, { ...query, congregationIds: query.congregation });
  }

  @Put('slots')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Pone a alguien en una fase; materializa la reunión si hace falta' })
  @ApiOkResponse({ description: 'La reunión, ya materializada' })
  assign(@CurrentChurch() churchId: string, @Body() dto: AssignSlotDto): Promise<MeetingView> {
    return this.assignments.assign(churchId, dto);
  }

  @Post('meetings')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Una reunión puntual, sin patrón detrás' })
  createMeeting(
    @CurrentChurch() churchId: string,
    @Body() dto: CreateMeetingDto,
  ): Promise<MeetingView> {
    return this.meetings.create(churchId, dto);
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
  @ApiOperation({ summary: 'Borrado lógico; si nació de un patrón, vuelve a propuesta' })
  removeMeeting(@CurrentChurch() churchId: string, @Param('id') id: string): Promise<void> {
    return this.meetings.remove(churchId, id);
  }

  @Get('preachers')
  @RequirePermissions('calendar.manage')
  @ApiOperation({ summary: 'Candidatos, ordenados por quien lleva más sin subir' })
  listPreachers(
    @CurrentChurch() churchId: string,
    @Query() query: PreachersQueryDto,
  ): Promise<Preacher[]> {
    return this.preachers.list(churchId, query);
  }

  @Get('summary')
  @RequirePermissions('calendar.view')
  @ApiOperation({ summary: 'Reparto del tramo y avisos' })
  summary(
    @CurrentChurch() churchId: string,
    @Query() query: RangeQueryDto,
  ): Promise<CalendarSummary> {
    return this.summaries.summary(churchId, { ...query, congregationIds: query.congregation });
  }
}
