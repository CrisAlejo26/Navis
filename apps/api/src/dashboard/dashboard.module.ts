import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BelieverNote } from '../believers/believer-note.entity';
import { Believer } from '../believers/believer.entity';
import { BelieversModule } from '../believers/believers.module';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { CalendarModule } from '../calendar/calendar.module';
import { Congregation } from '../calendar/congregation.entity';
import { ChurchesModule } from '../churches/churches.module';
import { TasksModule } from '../tasks/tasks.module';
import { DashboardActivityService } from './dashboard-activity.service';
import { DashboardCompositionService } from './dashboard-composition.service';
import { DashboardController } from './dashboard.controller';
import { DashboardEventsService } from './dashboard-events.service';
import { DashboardNotesService } from './dashboard-notes.service';
import { DashboardTasksService } from './dashboard-tasks.service';
import { DashboardService } from './dashboard.service';

/**
 * El panel de inicio (RFC 0001): no tiene entidad propia, solo lee las de
 * creyentes y calendario.
 *
 * `Believer`, `BelieverNote`, `Congregation`, `Ministry` y `Gift` se registran
 * también aquí —igual que hace `ListMemberStatsService` desde `lists`— para
 * consultarlas directamente: es más simple que ampliar lo que exporta cada
 * módulo solo para una lectura de repaso (Regla 1).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Believer, BelieverNote, Congregation, Ministry, Gift]),
    BelieversModule,
    CalendarModule,
    ChurchesModule,
    TasksModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardCompositionService,
    DashboardActivityService,
    DashboardEventsService,
    DashboardNotesService,
    DashboardTasksService,
  ],
})
export class DashboardModule {}
