import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreatePatternInput, UpdatePatternInput } from '@navis/shared';
import { Repository } from 'typeorm';

import { CongregationsService } from './congregations.service';
import { MeetingPattern } from './meeting-pattern.entity';
import { PatternPhase } from './pattern-phase.entity';

/**
 * Los patrones semanales: «los viernes en Elda a las 20:00, con estas fases».
 *
 * Editar un patrón **no reescribe lo ya materializado** (D7): una reunión que
 * alguien tocó es una decisión tomada, y el patrón nuevo se aplica de ahí en
 * adelante a lo que siga siendo propuesta.
 */
@Injectable()
export class PatternsService {
  constructor(
    @InjectRepository(MeetingPattern) private readonly patterns: Repository<MeetingPattern>,
    @InjectRepository(PatternPhase) private readonly phases: Repository<PatternPhase>,
    private readonly congregations: CongregationsService,
  ) {}

  list(churchId: string, calendarId: string): Promise<MeetingPattern[]> {
    return this.patterns.find({
      where: { churchId, calendarId },
      relations: { phases: true },
      /*
       * Las fases se ordenan **en la consulta**: sin `ORDER BY`, Postgres las
       * devuelve en el orden que le conviene y la reunión se lee «predicación,
       * testimonios, introducción». En SQLite salían por casualidad en el
       * orden de inserción, que es justo la clase de suerte que esconde el
       * fallo hasta producción.
       */
      order: { weekday: 'ASC', startTime: 'ASC', phases: { position: 'ASC' } },
    });
  }

  /** Los que se pueden proponer en el tramo: activos y dentro de su vigencia. */
  async activeFor(churchId: string, calendarId: string): Promise<MeetingPattern[]> {
    return (await this.list(churchId, calendarId)).filter((pattern) => pattern.isActive);
  }

  async create(
    churchId: string,
    calendarId: string,
    input: CreatePatternInput,
  ): Promise<MeetingPattern> {
    const congregation = await this.congregations.require(churchId, input.congregationId);

    const pattern = await this.patterns.save(
      this.patterns.create({
        churchId,
        calendarId,
        congregationId: congregation.id,
        name: input.name,
        weekday: input.weekday,
        startTime: input.startTime,
        accent: input.accent ?? congregation.accent,
        isActive: true,
        validFrom: input.validFrom ?? null,
        validTo: input.validTo ?? null,
      }),
    );

    await this.replacePhases(pattern.id, input.phases);
    return this.require(churchId, pattern.id);
  }

  async update(churchId: string, id: string, input: UpdatePatternInput): Promise<MeetingPattern> {
    const pattern = await this.require(churchId, id);

    if (input.name !== undefined) pattern.name = input.name;
    if (input.weekday !== undefined) pattern.weekday = input.weekday;
    if (input.startTime !== undefined) pattern.startTime = input.startTime;
    if (input.accent !== undefined) pattern.accent = input.accent;
    if (input.isActive !== undefined) pattern.isActive = input.isActive;
    if (input.validFrom !== undefined) pattern.validFrom = input.validFrom;
    if (input.validTo !== undefined) pattern.validTo = input.validTo;

    await this.patterns.save(pattern);
    if (input.phases) await this.replacePhases(pattern.id, input.phases);

    return this.require(churchId, id);
  }

  /** Borrado lógico. Las reuniones ya materializadas se quedan donde están. */
  async remove(churchId: string, id: string): Promise<void> {
    await this.patterns.softRemove(await this.require(churchId, id));
  }

  async require(churchId: string, id: string): Promise<MeetingPattern> {
    const pattern = await this.patterns.findOne({
      where: { id, churchId },
      relations: { phases: true },
      order: { phases: { position: 'ASC' } },
    });
    if (!pattern) throw new NotFoundException('Ese patrón no existe en esta iglesia');

    return pattern;
  }

  private async replacePhases(
    patternId: string,
    phases: readonly { name: string }[],
  ): Promise<void> {
    await this.phases.delete({ patternId });
    await this.phases.save(
      phases.map((phase, position) =>
        this.phases.create({ patternId, name: phase.name, position }),
      ),
    );
  }
}
