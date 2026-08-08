import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CONGREGATION_ACCENTS,
  DEFAULT_CONGREGATION_ACCENT,
  type CreateCongregationInput,
  type UpdateCongregationInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { Church } from '../churches/church.entity';
import { isUniqueViolation } from '../database/unique-violation';
import { Congregation } from './congregation.entity';

/**
 * Las sedes de una iglesia (RFC 0002 §5.1).
 *
 * Siempre hay al menos una y nunca se puede borrar la última: `meetings`
 * necesita una sede sí o sí, y dejar a una iglesia sin ninguna sería dejarla
 * sin poder programar nada.
 */
@Injectable()
export class CongregationsService {
  constructor(
    @InjectRepository(Congregation) private readonly congregations: Repository<Congregation>,
    @InjectRepository(Church) private readonly churches: Repository<Church>,
  ) {}

  list(churchId: string): Promise<Congregation[]> {
    return this.congregations.find({
      where: { churchId },
      order: { position: 'ASC', name: 'ASC' },
    });
  }

  /**
   * Las sedes, **garantizando que hay al menos una**.
   *
   * La migración se la dio a las iglesias que ya existían, pero una iglesia
   * creada después nacería sin ninguna, y sin sede no se puede programar nada.
   * Se resuelve aquí y no en `ChurchesService` para no invertir la dependencia
   * entre módulos: el calendario conoce a las iglesias, no al revés.
   *
   * No pasa por `create()`: su comprobación de nombre repetido es para quien
   * añade una sede a mano, y aquí competiría con la propia carrera que este
   * método tiene que absorber (dos peticiones a la vez pueden ver «ninguna» e
   * intentar sembrar la de serie). Sembrar directo deja un único desenlace que
   * vigilar: el choque contra `UQ_congregations_name`, que no es un fallo
   * real, solo haber llegado tarde a un trabajo ya hecho.
   */
  async ensureFor(churchId: string): Promise<Congregation[]> {
    const all = await this.list(churchId);
    if (all.length > 0) return all;

    const church = await this.churches.findOne({ where: { id: churchId } });
    try {
      await this.congregations.save(
        this.congregations.create({
          churchId,
          name: church?.name ?? 'Sede principal',
          city: null,
          accent: DEFAULT_CONGREGATION_ACCENT,
          position: 0,
          isDefault: true,
          isActive: true,
        }),
      );
    } catch (cause) {
      if (!isUniqueViolation(cause)) throw cause;
    }

    return this.list(churchId);
  }

  /** La sede que se propone al crear algo: la marcada por defecto o la primera. */
  async defaultFor(churchId: string): Promise<Congregation> {
    const all = await this.ensureFor(churchId);
    const chosen = all.find((one) => one.isDefault && one.isActive) ?? all[0];
    if (!chosen) throw new NotFoundException('Esta iglesia no tiene ninguna sede');

    return chosen;
  }

  async create(
    churchId: string,
    input: CreateCongregationInput,
    isDefault = false,
  ): Promise<Congregation> {
    const existing = await this.list(churchId);
    if (existing.some((one) => one.name.toLowerCase() === input.name.toLowerCase())) {
      throw new BadRequestException('Ya hay una sede con ese nombre');
    }

    return this.congregations.save(
      this.congregations.create({
        churchId,
        name: input.name,
        city: input.city ?? null,
        accent: input.accent ?? freeAccent(existing),
        position: existing.length,
        isDefault: isDefault || existing.length === 0,
        isActive: true,
      }),
    );
  }

  async update(
    churchId: string,
    id: string,
    input: UpdateCongregationInput,
  ): Promise<Congregation> {
    const congregation = await this.require(churchId, id);

    if (input.name !== undefined) congregation.name = input.name;
    if (input.city !== undefined) congregation.city = input.city;
    if (input.accent !== undefined) congregation.accent = input.accent;
    if (input.isActive !== undefined) congregation.isActive = input.isActive;

    return this.congregations.save(congregation);
  }

  async remove(churchId: string, id: string): Promise<void> {
    const congregation = await this.require(churchId, id);
    const all = await this.list(churchId);
    if (all.length <= 1) throw new BadRequestException('No se puede borrar la única sede');

    await this.congregations.softRemove(congregation);
  }

  /** La sede, comprobando que es de esta iglesia. 404 si no lo es. */
  async require(churchId: string, id: string): Promise<Congregation> {
    const congregation = await this.congregations.findOne({ where: { id, churchId } });
    if (!congregation) throw new NotFoundException('Esa sede no existe en esta iglesia');
    return congregation;
  }
}

/** El primer color libre, para que dos sedes no nazcan del mismo. */
function freeAccent(existing: readonly Congregation[]): string {
  const used = new Set(existing.map((one) => one.accent));
  return CONGREGATION_ACCENTS.find((accent) => !used.has(accent)) ?? DEFAULT_CONGREGATION_ACCENT;
}
