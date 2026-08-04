import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { believerName, type CreateBelieverInput, type UpdateBelieverInput } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { BelieverMinistry } from './believer-ministry.entity';
import { Believer } from './believer.entity';

export interface BelieverFilters {
  /** Busca por nombre o apellidos, sin distinguir mayúsculas. */
  q?: string;
  /** Solo quien tenga este ministerio (`pulpito`). */
  ministry?: string;
  /** Deja fuera a quien ya no está. Por defecto, sí. */
  onlyActive?: boolean;
}

/**
 * Las personas de la iglesia, en su versión mínima (RFC 0002 §6): lo justo
 * para poder programarles un turno. La ficha completa llega con la RFC 0003
 * sobre esta misma tabla.
 */
@Injectable()
export class BelieversService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(BelieverMinistry) private readonly ministries: Repository<BelieverMinistry>,
  ) {}

  async list(churchId: string, filters: BelieverFilters = {}): Promise<Believer[]> {
    const query = this.believers
      .createQueryBuilder('believer')
      .leftJoinAndSelect('believer.ministries', 'ministry')
      .where('believer.churchId = :churchId', { churchId })
      .orderBy('believer.firstName', 'ASC')
      .addOrderBy('believer.lastName', 'ASC');

    if (filters.onlyActive !== false)
      query.andWhere('believer.isActive = :active', { active: true });

    if (filters.q) {
      // Concatenado a mano: `||` funciona igual en Postgres y en SQLite, y así
      // «juan ruiz» encuentra a quien tiene el nombre partido en dos columnas.
      query.andWhere("LOWER(believer.firstName || ' ' || believer.lastName) LIKE :q", {
        q: `%${filters.q.toLowerCase()}%`,
      });
    }

    if (filters.ministry) {
      query.andWhere(
        'EXISTS (SELECT 1 FROM believer_ministries m WHERE m.believer_id = believer.id AND m.ministry = :ministry AND m.deleted_at IS NULL)',
        { ministry: filters.ministry },
      );
    }

    return query.getMany();
  }

  async create(churchId: string, input: CreateBelieverInput): Promise<Believer> {
    const believer = await this.believers.save(
      this.believers.create({
        churchId,
        congregationId: input.congregationId ?? null,
        firstName: input.firstName,
        lastName: input.lastName ?? '',
        phone: input.phone ?? null,
        isActive: true,
      }),
    );

    await this.setMinistries(believer.id, input.ministries ?? []);
    return this.require(churchId, believer.id);
  }

  async update(churchId: string, id: string, input: UpdateBelieverInput): Promise<Believer> {
    const believer = await this.require(churchId, id);

    if (input.firstName !== undefined) believer.firstName = input.firstName;
    if (input.lastName !== undefined) believer.lastName = input.lastName;
    if (input.phone !== undefined) believer.phone = input.phone;
    if (input.congregationId !== undefined) believer.congregationId = input.congregationId;
    if (input.isActive !== undefined) believer.isActive = input.isActive;

    await this.believers.save(believer);
    if (input.ministries) await this.setMinistries(believer.id, input.ministries);

    return this.require(churchId, id);
  }

  async remove(churchId: string, id: string): Promise<void> {
    await this.believers.softRemove(await this.require(churchId, id));
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

  async require(churchId: string, id: string): Promise<Believer> {
    const believer = await this.believers.findOne({
      where: { id, churchId },
      relations: { ministries: true },
    });
    if (!believer) throw new NotFoundException('Esa persona no está en esta iglesia');
    return believer;
  }

  /**
   * Deja exactamente esos ministerios. Se borra y se vuelve a escribir en vez
   * de comparar: son dos filas como mucho y el índice único ya impide repetir.
   */
  private async setMinistries(believerId: string, ministries: readonly string[]): Promise<void> {
    await this.ministries.delete({ believerId });
    if (ministries.length === 0) return;

    await this.ministries.save(
      ministries.map((ministry) => this.ministries.create({ believerId, ministry })),
    );
  }
}
