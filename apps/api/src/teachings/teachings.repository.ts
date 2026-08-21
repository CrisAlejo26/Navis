import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';

import { Teaching } from './teaching.entity';

/**
 * El **único** sitio del proyecto que toca la tabla `teachings`.
 *
 * Calcado de `PropheciesRepository` (RFC 0004 D1): sin permisos de rol y sin
 * guard de iglesia, la única barrera de acceso es el filtro por dueño, y por
 * eso vive aquí y no en el controlador — todos los métodos exigen `ownerId`
 * como primer parámetro.
 */
@Injectable()
export class TeachingsRepository {
  constructor(@InjectRepository(Teaching) private readonly teachings: Repository<Teaching>) {}

  scoped(ownerId: string): SelectQueryBuilder<Teaching> {
    return this.teachings
      .createQueryBuilder('teaching')
      .where('teaching.ownerId = :ownerId', { ownerId });
  }

  /** 404 y no 403: quien pregunta por el identificador de otro no tiene por qué saber que acertó. */
  async require(ownerId: string, id: string): Promise<Teaching> {
    const teaching = await this.teachings.findOne({ where: { id, ownerId } });
    if (!teaching) throw new NotFoundException('Esa enseñanza no existe');
    return teaching;
  }

  /** Todas las del dueño, sin paginar — para las estadísticas de la portada. */
  all(ownerId: string): Promise<Teaching[]> {
    return this.teachings.find({ where: { ownerId } });
  }

  create(ownerId: string, data: Partial<Teaching>): Teaching {
    return this.teachings.create({ ...data, ownerId });
  }

  save(teaching: Teaching): Promise<Teaching> {
    return this.teachings.save(teaching);
  }

  async softRemove(teaching: Teaching): Promise<void> {
    await this.teachings.softRemove(teaching);
  }
}
