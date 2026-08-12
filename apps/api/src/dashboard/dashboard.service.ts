import { Injectable } from '@nestjs/common';
import { believerName, type DashboardSummary } from '@navis/shared';

import { BelieversPageService } from '../believers/believers-page.service';
import { BelieversSummaryService } from '../believers/believers-summary.service';
import { ChurchClockService } from '../churches/church-clock.service';
import { DashboardActivityService } from './dashboard-activity.service';
import { DashboardCompositionService } from './dashboard-composition.service';
import { DashboardEventsService } from './dashboard-events.service';
import { DashboardNotesService } from './dashboard-notes.service';
import { DashboardTasksService } from './dashboard-tasks.service';

/**
 * Todo lo del panel de inicio, reunido en una sola respuesta (RFC 0001).
 *
 * No hay lógica propia que valga la pena probar aquí: cada pieza ya se calcula
 * —y se prueba— donde vive (creyentes, calendario, bitácora); esto solo las
 * pide en paralelo y arma la forma que pinta la portada.
 */
@Injectable()
export class DashboardService {
  constructor(
    private readonly believersSummary: BelieversSummaryService,
    private readonly believersPage: BelieversPageService,
    private readonly clock: ChurchClockService,
    private readonly composition: DashboardCompositionService,
    private readonly activity: DashboardActivityService,
    private readonly events: DashboardEventsService,
    private readonly notes: DashboardNotesService,
    private readonly tasks: DashboardTasksService,
  ) {}

  async summary(churchId: string, ownerId: string): Promise<DashboardSummary> {
    const today = await this.clock.today(churchId);

    const [
      believers,
      attentionPage,
      composition,
      weeklyActivity,
      upcomingEvents,
      recentNotes,
      todayTasks,
    ] = await Promise.all([
      this.believersSummary.of(churchId, today),
      this.believersPage.findPage(
        churchId,
        { page: 1, limit: 5, sort: 'lastNote', order: 'asc', attention: true },
        today,
      ),
      this.composition.of(churchId),
      this.activity.weekly(churchId, today),
      this.events.upcoming(churchId, today),
      this.notes.recent(churchId),
      this.tasks.today(churchId, ownerId, today),
    ]);

    return {
      believers: { total: believers.total, newThisMonth: believers.newThisMonth },
      attention: {
        count: believers.needsAttention,
        people: attentionPage.items.map((one) => ({
          id: one.id,
          name: believerName(one),
          hasPhoto: one.hasPhoto,
          daysWithoutNote: one.daysWithoutNote,
        })),
      },
      upcomingEvents,
      recentNotes,
      composition,
      weeklyActivity,
      todayTasks: todayTasks.tasks,
      taskStreak: todayTasks.streak,
    };
  }
}
