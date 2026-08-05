import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { believerName, LIST_OVERLAP_LIMIT, type ListStats } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { ListMember } from './list-member.entity';
import { List } from './list.entity';

/**
 * **El solapamiento**: en cuántas listas más está la gente de esta (RFC 0010
 * D36).
 *
 * Es fácil llenar una pantalla de contadores. La cuenta que no se puede hacer
 * sin esta funcionalidad y que un pastor necesita de verdad es esta: quien sale
 * en cinco se está quemando, y hoy eso no lo sabe nadie hasta que se cae.
 */
@Injectable()
export class ListOverlapService {
  constructor(
    @InjectRepository(ListMember) private readonly members: Repository<ListMember>,
    @InjectRepository(List) private readonly lists: Repository<List>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
  ) {}

  async of(churchId: string, listId: string): Promise<ListStats['overlap']> {
    const listas = await this.lists.find({ where: { churchId } });
    if (listas.length === 0) return { inOtherLists: [], sharedWith: [] };

    const rows = await this.members.find({ where: { listId: In(listas.map((one) => one.id)) } });
    const aqui = new Set(rows.filter((row) => row.listId === listId).map((row) => row.believerId));
    if (aqui.size === 0) return { inOtherLists: [], sharedWith: [] };

    // Solo cuentan las personas que siguen vivas: una borrada no está en ninguna.
    const vivos = new Set(
      (await this.believers.find({ where: { id: In([...aqui]) } })).map((one) => one.id),
    );

    const cuantas = new Map<string, number>();
    const cruces = new Map<string, number>();

    for (const row of rows) {
      if (!vivos.has(row.believerId)) continue;
      cuantas.set(row.believerId, (cuantas.get(row.believerId) ?? 0) + 1);
      if (row.listId !== listId) cruces.set(row.listId, (cruces.get(row.listId) ?? 0) + 1);
    }

    return {
      inOtherLists: await this.topPeople(cuantas),
      sharedWith: listas
        .filter((one) => cruces.has(one.id))
        .map((one) => ({
          listId: one.id,
          name: one.name,
          accent: one.accent,
          count: cruces.get(one.id) ?? 0,
        }))
        .sort((uno, otro) => otro.count - uno.count || uno.name.localeCompare(otro.name)),
    };
  }

  private async topPeople(
    cuantas: Map<string, number>,
  ): Promise<ListStats['overlap']['inOtherLists']> {
    const muchos = [...cuantas]
      .filter(([, total]) => total > 1)
      .sort((uno, otro) => otro[1] - uno[1])
      .slice(0, LIST_OVERLAP_LIMIT);
    if (muchos.length === 0) return [];

    const people = await this.believers.find({ where: { id: In(muchos.map(([id]) => id)) } });
    const byId = new Map(people.map((person) => [person.id, believerName(person)]));

    return muchos.flatMap(([believerId, listCount]) => {
      const name = byId.get(believerId);
      return name ? [{ believerId, name, listCount }] : [];
    });
  }
}
