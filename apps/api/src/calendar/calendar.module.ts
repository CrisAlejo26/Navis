import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BelieversModule } from '../believers/believers.module';
import { Church } from '../churches/church.entity';
import { ChurchesModule } from '../churches/churches.module';
import { AssignmentsService } from './assignments.service';
import { Calendar } from './calendar.entity';
import { CalendarsController } from './calendars.controller';
import { CalendarsService } from './calendars.service';
import { Congregation } from './congregation.entity';
import { CongregationsController } from './congregations.controller';
import { CongregationsService } from './congregations.service';
import { MeetingPattern } from './meeting-pattern.entity';
import { MeetingSlot } from './meeting-slot.entity';
import { Meeting } from './meeting.entity';
import { MeetingsService } from './meetings.service';
import { PatternPhase } from './pattern-phase.entity';
import { PatternsController } from './patterns.controller';
import { PatternsService } from './patterns.service';
import { PreachersService } from './preachers.service';
import { ScheduleController } from './schedule.controller';
import { ScheduleService } from './schedule.service';
import { SummaryService } from './summary.service';

/**
 * El calendario de programaciones (RFC 0002): sedes, patrones semanales,
 * reuniones y quién ocupa cada fase.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Calendar,
      Congregation,
      MeetingPattern,
      PatternPhase,
      Meeting,
      MeetingSlot,
      Church,
    ]),
    ChurchesModule,
    BelieversModule,
  ],
  controllers: [
    ScheduleController,
    CalendarsController,
    CongregationsController,
    PatternsController,
  ],
  providers: [
    CalendarsService,
    CongregationsService,
    PatternsService,
    ScheduleService,
    MeetingsService,
    AssignmentsService,
    PreachersService,
    SummaryService,
  ],
  exports: [CalendarsService, CongregationsService, ScheduleService],
})
export class CalendarModule {}
