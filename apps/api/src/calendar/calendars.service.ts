import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  SEEDED_CALENDARS,
  toSlug,
  type CreateCalendarInput,
  type UpdateCalendarInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { Calendar } from './calendar.entity';

/**
 * Los calendarios de una iglesia (RFC 0002 D15): púlpito, recepción, sonido,
 * biblias y los que cada una añada.
 *
 * Siempre hay al menos uno y nunca se borra el último: la sección se quedaría
 * sin nada que enseñar y la barra lateral, con una entrada que no lleva a
 * ningún sitio.
 */
@Injectable()
export class CalendarsService {
  constructor(@InjectRepository(Calendar) private readonly calendars: Repository<Calendar>) {}

  list(churchId: string): Promise<Calendar[]> {
    return this.calendars.find({ where: { churchId }, order: { position: 'ASC', name: 'ASC' } });
  }

  /**
   * Los calendarios, sembrando los cuatro de serie si la iglesia no tiene
   * ninguno. Igual que con las sedes, una iglesia creada después de la
   * migración nacería vacía y no habría dónde programar.
   */
  async ensureFor(churchId: string): Promise<Calendar[]> {
    const all = await this.list(churchId);
    if (all.length > 0) return all;

    await this.calendars.save(
      SEEDED_CALENDARS.map((one, position) =>
        this.calendars.create({
          churchId,
          name: one.name,
          slug: one.slug,
          ministry: one.ministry,
          position,
        }),
      ),
    );

    return this.list(churchId);
  }

  async create(churchId: string, input: CreateCalendarInput): Promise<Calendar> {
    const existing = await this.ensureFor(churchId);
    const slug = await this.freeSlug(churchId, input.name);

    if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('Ya hay un calendario con ese nombre');
    }

    return this.calendars.save(
      this.calendars.create({
        churchId,
        name: input.name,
        slug,
        ministry: input.ministry ?? null,
        position: existing.length,
      }),
    );
  }

  /**
   * Renombrar **no cambia el `slug`**: es lo que hay en la URL y en los enlaces
   * que alguien haya guardado. Cambia el nombre, que es lo que se lee.
   */
  async update(churchId: string, id: string, input: UpdateCalendarInput): Promise<Calendar> {
    const calendar = await this.require(churchId, id);

    if (input.name !== undefined) calendar.name = input.name;
    if (input.ministry !== undefined) calendar.ministry = input.ministry;
    if (input.position !== undefined) calendar.position = input.position;

    return this.calendars.save(calendar);
  }

  async remove(churchId: string, id: string): Promise<void> {
    const calendar = await this.require(churchId, id);
    const all = await this.list(churchId);
    if (all.length <= 1) throw new BadRequestException('No se puede borrar el único calendario');

    await this.calendars.softRemove(calendar);
  }

  async require(churchId: string, id: string): Promise<Calendar> {
    const calendar = await this.calendars.findOne({ where: { id, churchId } });
    if (!calendar) throw new NotFoundException('Ese calendario no existe en esta iglesia');
    return calendar;
  }

  /** `pulpito`, `pulpito-2`… Dos calendarios pueden llamarse casi igual. */
  private async freeSlug(churchId: string, name: string): Promise<string> {
    const base = toSlug(name, 40) || 'calendario';

    for (let intento = 1; ; intento += 1) {
      const slug = intento === 1 ? base : `${base}-${String(intento)}`;
      if (!(await this.calendars.exists({ where: { churchId, slug } }))) return slug;
    }
  }
}
