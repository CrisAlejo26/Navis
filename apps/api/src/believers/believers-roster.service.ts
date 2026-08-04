import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { believerName, SCHEDULABLE_STATUSES, toSearchName } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Believer } from './believer.entity';

export interface RosterFilters {
  /** Busca por nombre o apellidos, sin acentos y sin distinguir mayúsculas. */
  q?: string;
  /** Solo quien tenga esa labor (`pulpito`). */
  ministry?: string;
  /** Deja fuera a quien ya no viene. Por defecto, sí (RFC 0003 D2). */
  onlySchedulable?: boolean;
}

/**
 * La lista llana de personas que consume **el calendario**: sin paginar,
 * ordenada por nombre y sin arrastrar dones ni bitácora.
 *
 * Está separada de `BelieversService` a propósito: programar un turno no tiene
 * por qué cargar la ficha pastoral de nadie, y el listado de la pantalla de
 * creyentes es otra consulta muy distinta (`BelieversPageService`).
 */
@Injectable()
export class BelieversRosterService {
  constructor(@InjectRepository(Believer) private readonly believers: Repository<Believer>) {}

  list(churchId: string, filters: RosterFilters = {}): Promise<Believer[]> {
    const query = this.believers
      .createQueryBuilder('believer')
      .leftJoinAndSelect('believer.ministries', 'ministry')
      .where('believer.churchId = :churchId', { churchId })
      .orderBy('believer.firstName', 'ASC')
      .addOrderBy('believer.lastName', 'ASC');

    // Quien ya no viene deja de proponerse: es lo que antes decía `is_active` y
    // ahora dice el estado, sin dos fuentes de verdad (D2).
    if (filters.onlySchedulable !== false) {
      query.andWhere('believer.status IN (:...statuses)', { statuses: [...SCHEDULABLE_STATUSES] });
    }

    if (filters.q) {
      query.andWhere('believer.searchName LIKE :q', { q: `%${toSearchName(filters.q)}%` });
    }

    if (filters.ministry) {
      query.andWhere(
        'EXISTS (SELECT 1 FROM believer_ministries m WHERE m.believer_id = believer.id AND m.ministry = :ministry AND m.deleted_at IS NULL)',
        { ministry: filters.ministry },
      );
    }

    return query.getMany();
  }

  /**
   * Los nombres compuestos de esas personas, para pintar la cinta de un tramo
   * con una sola consulta.
   *
   * `withDeleted` a propósito: quien ya no está sigue apareciendo en los meses
   * en los que predicó. Se le deja de proponer, no se le borra de la historia.
   */
  async namesOf(ids: readonly (string | null)[]): Promise<Map<string, string>> {
    // Los vacíos se caen aquí: en Postgres, un `IN ('')` contra una columna
    // `uuid` no devuelve nada, revienta la consulta entera.
    const unique = [...new Set(ids)].filter((id): id is string => Boolean(id));
    if (unique.length === 0) return new Map();

    const people = await this.believers.find({ where: { id: In(unique) }, withDeleted: true });
    return new Map(people.map((person) => [person.id, believerName(person)]));
  }
}
