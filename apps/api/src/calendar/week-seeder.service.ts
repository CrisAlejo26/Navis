import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { defaultWeekFor } from '@navis/shared';
import { Repository } from 'typeorm';

import { Calendar } from './calendar.entity';
import { CalendarsService } from './calendars.service';
import { Congregation } from './congregation.entity';
import { CongregationsService } from './congregations.service';
import { MeetingPattern } from './meeting-pattern.entity';
import { PatternPhase } from './pattern-phase.entity';

export interface ChurchScaffold {
  calendars: Calendar[];
  congregations: Congregation[];
}

/**
 * Siembra la semana de serie (`DEFAULT_WEEK`) en un calendario y una sede.
 *
 * Se llama al crear un calendario —en todas sus sedes— y al crear una sede —en
 * todos sus calendarios—, porque una cuadrícula vacía no dice nada: es más
 * rápido corregir el lunes que escribir siete reuniones desde cero. Cuál se
 * siembra lo decide el **ministerio** del calendario (`defaultWeekFor`).
 *
 * **Idempotente**: si esa pareja ya tiene alguna reunión fija, no toca nada.
 * Quien ya ha ajustado su semana no quiere que se la vuelvan a llenar.
 */
@Injectable()
export class WeekSeederService {
  constructor(
    @InjectRepository(MeetingPattern) private readonly patterns: Repository<MeetingPattern>,
    @InjectRepository(PatternPhase) private readonly phases: Repository<PatternPhase>,
    @InjectRepository(Congregation) private readonly congregations: Repository<Congregation>,
    @InjectRepository(Calendar) private readonly calendars: Repository<Calendar>,
    private readonly calendarsService: CalendarsService,
    private readonly congregationsService: CongregationsService,
  ) {}

  /**
   * Los calendarios y las sedes de una iglesia, garantizando que existen **y**
   * que cada pareja tiene su semana de serie sembrada.
   *
   * Es el único punto de entrada que hace falta cuando algo necesita «el
   * calendario de esta iglesia funcionando»: antes cada controlador sembraba
   * solo su mitad —`/calendars` la semana en cada sede al crear un calendario,
   * `/congregations` ni eso—, y quien llegaba primero a una iglesia recién
   * creada por una vía distinta a esas dos pantallas —el panel de inicio,
   * llamando a `ensureFor` a secas— dejaba calendarios y sede sin semana, sin
   * que nadie lo notara hasta programar.
   */
  async ensureScaffold(churchId: string): Promise<ChurchScaffold> {
    const [calendars, congregations] = await Promise.all([
      this.calendarsService.ensureFor(churchId),
      this.congregationsService.ensureFor(churchId),
    ]);

    for (const calendar of calendars) {
      for (const congregation of congregations) {
        await this.seed(churchId, calendar.id, congregation.id);
      }
    }

    return { calendars, congregations };
  }

  /** La semana en cada sede activa de la iglesia, para un calendario nuevo. */
  async seedCalendar(churchId: string, calendarId: string): Promise<void> {
    const sedes = await this.congregations.find({ where: { churchId, isActive: true } });
    for (const sede of sedes) await this.seed(churchId, calendarId, sede.id);
  }

  /** La semana en cada calendario de la iglesia, para una sede nueva. */
  async seedCongregation(churchId: string, congregationId: string, calendarIds: readonly string[]) {
    for (const calendarId of calendarIds) await this.seed(churchId, calendarId, congregationId);
  }

  async seed(churchId: string, calendarId: string, congregationId: string): Promise<void> {
    const yaTiene = await this.patterns.exists({ where: { churchId, calendarId, congregationId } });
    if (yaTiene) return;

    const congregation = await this.congregations.findOne({ where: { id: congregationId } });
    const calendar = await this.calendars.findOne({ where: { id: calendarId } });

    // Cada ministerio tiene su semana: el púlpito reparte tramos de reunión,
    // recepción hace turnos de puerta y sonido cubre el encuentro entero.
    for (const reunion of defaultWeekFor(calendar?.ministry)) {
      const pattern = await this.patterns.save(
        this.patterns.create({
          churchId,
          calendarId,
          congregationId,
          name: reunion.name,
          weekday: reunion.weekday,
          startTime: reunion.startTime,
          accent: congregation?.accent ?? 'primary',
          isActive: true,
        }),
      );

      await this.phases.save(
        reunion.phases.map((name, position) =>
          this.phases.create({ patternId: pattern.id, name, position }),
        ),
      );
    }
  }
}
