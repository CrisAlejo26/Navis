import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, type SelectQueryBuilder } from 'typeorm';

import { Dream } from './dream.entity';

/**
 * El **único** sitio del proyecto que toca la tabla `dreams`.
 *
 * Existe por la RFC 0005 D1: aquí no hay permisos de rol ni guard de iglesia, y
 * la única barrera de acceso es el filtro por dueño. Por eso el filtro vive en
 * el repositorio y no en el controlador — **todos** los métodos exigen el
 * `ownerId` como primer parámetro, así que un endpoint nuevo que se olvide de
 * él no llega a compilar.
 *
 * La regla, para quien venga después: ningún servicio inyecta
 * `Repository<Dream>` directamente. Si hace falta una consulta nueva, se añade
 * aquí.
 */
@Injectable()
export class DreamsRepository {
  constructor(@InjectRepository(Dream) private readonly dreams: Repository<Dream>) {}

  /** Un constructor de consultas ya acotado al dueño. El único punto de entrada. */
  scoped(ownerId: string): SelectQueryBuilder<Dream> {
    return this.dreams.createQueryBuilder('dream').where('dream.ownerId = :ownerId', { ownerId });
  }

  /**
   * El sueño, comprobando que es suyo.
   *
   * **404 y no 403**: un 403 confirmaría que existe, y quien pregunta por el
   * identificador de otro no tiene por qué enterarse de que acertó.
   */
  async require(ownerId: string, id: string): Promise<Dream> {
    const dream = await this.dreams.findOne({ where: { id, ownerId } });
    if (!dream) throw new NotFoundException('Ese sueño no existe');
    return dream;
  }

  /** Con sus emociones y sus audios. Para la ficha. */
  async requireFull(ownerId: string, id: string): Promise<Dream> {
    const dream = await this.dreams.findOne({
      where: { id, ownerId },
      relations: { emotions: true, audios: true },
      // Una relación sin ORDER BY no vuelve ordenada en Postgres (CLAUDE.md).
      order: { audios: { createdAt: 'ASC' } },
    });
    if (!dream) throw new NotFoundException('Ese sueño no existe');
    return dream;
  }

  /** Solo los identificadores. Es lo que hace falta para contar por emoción. */
  async idsOf(ownerId: string): Promise<string[]> {
    const rows = await this.scoped(ownerId).select(['dream.id']).getMany();
    return rows.map((row) => row.id);
  }

  create(ownerId: string, data: Partial<Dream>): Dream {
    return this.dreams.create({ ...data, ownerId });
  }

  save(dream: Dream): Promise<Dream> {
    return this.dreams.save(dream);
  }

  async softRemove(dream: Dream): Promise<void> {
    await this.dreams.softRemove(dream);
  }
}
