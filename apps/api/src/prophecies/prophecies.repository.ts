import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';

import { Prophecy } from './prophecy.entity';

/**
 * El **único** sitio del proyecto que toca la tabla `prophecies`.
 *
 * Existe por la RFC 0004 D1: aquí no hay permisos de rol ni guard de iglesia, y
 * la única barrera de acceso es el filtro por dueño. Por eso el filtro vive en
 * el repositorio y no en el controlador — **todos** los métodos exigen el
 * `ownerId` como primer parámetro, así que un endpoint nuevo que se olvide de
 * él no llega a compilar.
 *
 * La regla, para quien venga después: ningún servicio inyecta
 * `Repository<Prophecy>` directamente. Si hace falta una consulta nueva, se
 * añade aquí.
 */
@Injectable()
export class PropheciesRepository {
  constructor(@InjectRepository(Prophecy) private readonly prophecies: Repository<Prophecy>) {}

  /** Un constructor de consultas ya acotado al dueño. Es el único punto de entrada. */
  scoped(ownerId: string): SelectQueryBuilder<Prophecy> {
    return this.prophecies
      .createQueryBuilder('prophecy')
      .where('prophecy.ownerId = :ownerId', { ownerId });
  }

  /**
   * La profecía, comprobando que es suya.
   *
   * **404 y no 403**: un 403 confirmaría que existe, y quien pregunta por el
   * identificador de otro no tiene por qué enterarse de que acertó.
   */
  async require(ownerId: string, id: string): Promise<Prophecy> {
    const prophecy = await this.prophecies.findOne({ where: { id, ownerId } });
    if (!prophecy) throw new NotFoundException('Esa profecía no existe');
    return prophecy;
  }

  /** Con sus cumplimientos, ordenados hacia atrás. Para la ficha. */
  async requireWithFulfillments(ownerId: string, id: string): Promise<Prophecy> {
    const prophecy = await this.prophecies.findOne({
      where: { id, ownerId },
      relations: { fulfillments: true },
      // Una relación sin ORDER BY no vuelve ordenada en Postgres (CLAUDE.md).
      order: { fulfillments: { occurredAt: 'DESC', createdAt: 'DESC' } },
    });
    if (!prophecy) throw new NotFoundException('Esa profecía no existe');
    return prophecy;
  }

  create(ownerId: string, data: Partial<Prophecy>): Prophecy {
    return this.prophecies.create({ ...data, ownerId });
  }

  save(prophecy: Prophecy): Promise<Prophecy> {
    return this.prophecies.save(prophecy);
  }

  async softRemove(prophecy: Prophecy): Promise<void> {
    await this.prophecies.softRemove(prophecy);
  }
}
