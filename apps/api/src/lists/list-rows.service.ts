import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ListMember as ListMemberView } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { Congregation } from '../calendar/congregation.entity';
import { ListGrant } from './list-grant.entity';
import { ListMember } from './list-member.entity';
import { ListViewer } from './list-viewer.entity';

/**
 * Las filas de una lista, con lo que hace falta para pintarlas.
 *
 * Se piden en tres consultas —miembros, personas, sedes— y se juntan aquí, en
 * vez de un `join` con relaciones: es lo que evita la subconsulta con `DISTINCT`
 * de TypeORM y su exigencia de Postgres (CLAUDE.md), y de paso deja el filtro de
 * `deleted_at` **por los dos lados** a la vista.
 *
 * Una persona borrada desaparece del cartel y de la ficha, pero su fila de
 * `list_members` se queda: si se la recupera, vuelve donde estaba.
 */
@Injectable()
export class ListRowsService {
  constructor(
    @InjectRepository(ListMember) private readonly members: Repository<ListMember>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(Congregation) private readonly congregations: Repository<Congregation>,
    @InjectRepository(ListGrant) private readonly grants: Repository<ListGrant>,
    @InjectRepository(ListViewer) private readonly viewers: Repository<ListViewer>,
  ) {}

  /** Los miembros en crudo, **siempre ordenados**: sin `ORDER BY` explícito
   * Postgres los devuelve como quiera y el cartel sale desordenado (§6.2). */
  rows(listId: string): Promise<ListMember[]> {
    return this.members.find({ where: { listId }, order: { position: 'ASC' } });
  }

  async view(listId: string): Promise<ListMemberView[]> {
    const rows = await this.rows(listId);
    if (rows.length === 0) return [];

    const people = await this.believers.find({
      where: { id: In(rows.map((row) => row.believerId)) },
      relations: { ministries: true },
    });
    const byId = new Map(people.map((person) => [person.id, person]));

    const sedes = new Map(
      (
        await this.congregations.find({
          where: { id: In([...new Set(people.map((one) => one.congregationId).filter(Boolean))]) },
        })
      ).map((sede) => [sede.id, sede]),
    );

    const conLlave = await this.withAccess(listId, [...byId.keys()]);

    return rows.flatMap((row) => {
      const person = byId.get(row.believerId);
      if (!person) return [];
      const sede = person.congregationId ? sedes.get(person.congregationId) : undefined;

      return [
        {
          believerId: person.id,
          firstName: person.firstName,
          lastName: person.lastName,
          position: row.position,
          note: row.note,
          congregationId: person.congregationId,
          congregationName: sede?.name ?? null,
          congregationAccent: sede?.accent ?? null,
          ministries: person.ministries.map((one) => one.ministry),
          hasPhoto: Boolean(person.photoKey),
          hasAccess: conLlave.has(person.id),
        },
      ];
    });
  }

  /**
   * Quién de estos tiene además **acceso a esta lista** (D21). Es la llave
   * pequeña de la fila: estar en una lista y poder verla son cosas distintas, y
   * esto es lo que lo enseña sin cambiar de pestaña.
   */
  private async withAccess(listId: string, believerIds: string[]): Promise<Set<string>> {
    if (believerIds.length === 0) return new Set();

    const viewerIds = (await this.grants.find({ where: { listId } })).map((one) => one.viewerId);
    if (viewerIds.length === 0) return new Set();

    const conAcceso = await this.viewers.find({
      where: { id: In(viewerIds), believerId: In(believerIds), isActive: true },
    });

    return new Set(conAcceso.flatMap((one) => (one.believerId ? [one.believerId] : [])));
  }
}
