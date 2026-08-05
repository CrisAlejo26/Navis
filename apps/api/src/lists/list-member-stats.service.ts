import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_CONGREGATION_ACCENT, type ListStats } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { Congregation } from '../calendar/congregation.entity';
import { ListMember } from './list-member.entity';

type Bucket = { label: string; accent: string; count: number };

/** Cómo está compuesta una lista: sedes, labores, dones y estados (§7.4). */
@Injectable()
export class ListMemberStatsService {
  constructor(
    @InjectRepository(ListMember) private readonly members: Repository<ListMember>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(Congregation) private readonly congregations: Repository<Congregation>,
    @InjectRepository(Ministry) private readonly ministries: Repository<Ministry>,
    @InjectRepository(Gift) private readonly gifts: Repository<Gift>,
  ) {}

  async of(churchId: string, listId: string): Promise<ListStats['members']> {
    const people = await this.peopleOf(listId);
    const vacio = {
      total: 0,
      byCongregation: [],
      byMinistry: [],
      byGift: [],
      byStatus: [],
      withoutCongregation: 0,
    };
    if (people.length === 0) return vacio;

    const [sedes, labores, dones] = await Promise.all([
      this.congregations.find({ where: { churchId } }),
      this.ministries.find({ where: { churchId } }),
      this.gifts.find({ where: { churchId } }),
    ]);

    const nombre = new Map(sedes.map((one) => [one.id, one]));
    const labor = new Map(labores.map((one) => [one.slug, one]));
    const don = new Map(dones.map((one) => [one.id, one]));

    return {
      total: people.length,
      byCongregation: count(
        people.flatMap((person) => (person.congregationId ? [person.congregationId] : [])),
        (id) => ({ label: nombre.get(id)?.name ?? '—', accent: nombre.get(id)?.accent }),
      ),
      byMinistry: count(
        people.flatMap((person) => person.ministries.map((one) => one.ministry)),
        (slug) => ({ label: labor.get(slug)?.name ?? slug, accent: labor.get(slug)?.accent }),
      ),
      byGift: count(
        people.flatMap((person) => person.gifts.map((one) => one.giftId)),
        (id) => ({ label: don.get(id)?.name ?? '—', accent: don.get(id)?.accent }),
      ),
      byStatus: count(
        people.map((person) => person.status),
        (status) => ({ label: status }),
      ),
      withoutCongregation: people.filter((person) => !person.congregationId).length,
    };
  }

  /** Las personas **vivas** de la lista, con lo que hace falta para contarlas. */
  private async peopleOf(listId: string): Promise<Believer[]> {
    const rows = await this.members.find({ where: { listId } });
    if (rows.length === 0) return [];

    return this.believers.find({
      where: { id: In(rows.map((row) => row.believerId)) },
      relations: { ministries: true, gifts: true },
    });
  }
}

/** Cuenta y ordena de más a menos. Lo que no tiene color propio va en gris. */
function count(
  values: readonly string[],
  describe: (value: string) => { label: string; accent?: string },
): Bucket[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  return [...counts]
    .map(([value, total]) => {
      const { label, accent } = describe(value);
      return { label, accent: accent ?? DEFAULT_CONGREGATION_ACCENT, count: total };
    })
    .sort((uno, otro) => otro.count - uno.count || uno.label.localeCompare(otro.label));
}
