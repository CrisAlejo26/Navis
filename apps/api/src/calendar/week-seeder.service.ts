import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_WEEK } from '@navis/shared';
import { Repository } from 'typeorm';

import { Congregation } from './congregation.entity';
import { MeetingPattern } from './meeting-pattern.entity';
import { PatternPhase } from './pattern-phase.entity';

/**
 * Siembra la semana de serie (`DEFAULT_WEEK`) en un calendario y una sede.
 *
 * Se llama al crear un calendario —en todas sus sedes— y al crear una sede —en
 * todos sus calendarios—, porque una cuadrícula vacía no dice nada: es más
 * rápido corregir el lunes que escribir siete reuniones desde cero.
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
  ) {}

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

    for (const reunion of DEFAULT_WEEK) {
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
