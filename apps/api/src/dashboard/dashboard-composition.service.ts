import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DEFAULT_CONGREGATION_ACCENT, type DashboardBucket } from '@navis/shared';
import { Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { Gift } from '../believers/gift.entity';
import { Ministry } from '../believers/ministry.entity';
import { Congregation } from '../calendar/congregation.entity';

export interface DashboardComposition {
  byCongregation: DashboardBucket[];
  byMinistry: DashboardBucket[];
  byGift: DashboardBucket[];
}

/**
 * Cómo está repartida **toda la iglesia** entre sedes, labores y dones.
 *
 * Es el mismo cálculo que `ListMemberStatsService` (Regla 1 §5: dos usos que
 * se parecen hoy pueden separarse mañana), pero sobre los creyentes activos de
 * la iglesia y no sobre los de una lista. Si aparece un tercer sitio que lo
 * necesite, es entonces cuando se extrae.
 */
@Injectable()
export class DashboardCompositionService {
  constructor(
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(Congregation) private readonly congregations: Repository<Congregation>,
    @InjectRepository(Ministry) private readonly ministries: Repository<Ministry>,
    @InjectRepository(Gift) private readonly gifts: Repository<Gift>,
  ) {}

  async of(churchId: string): Promise<DashboardComposition> {
    const [people, sedes, labores, dones] = await Promise.all([
      this.believers.find({
        where: { churchId },
        relations: { ministries: true, gifts: true },
      }),
      this.congregations.find({ where: { churchId } }),
      this.ministries.find({ where: { churchId } }),
      this.gifts.find({ where: { churchId } }),
    ]);

    // «Activo» y «nuevo» son quien de verdad está hoy en la iglesia; a quien se
    // ha ido o se ha trasladado no tiene sentido contarlo en el reparto actual.
    const active = people.filter((one) => one.status === 'activo' || one.status === 'nuevo');

    const nombre = new Map(sedes.map((one) => [one.id, one]));
    const labor = new Map(labores.map((one) => [one.slug, one]));
    const don = new Map(dones.map((one) => [one.id, one]));

    return {
      byCongregation: count(
        active.flatMap((person) => (person.congregationId ? [person.congregationId] : [])),
        (id) => ({ label: nombre.get(id)?.name ?? '—', accent: nombre.get(id)?.accent }),
      ),
      byMinistry: count(
        active.flatMap((person) => person.ministries.map((one) => one.ministry)),
        (slug) => ({ label: labor.get(slug)?.name ?? slug, accent: labor.get(slug)?.accent }),
      ),
      byGift: count(
        active.flatMap((person) => person.gifts.map((one) => one.giftId)),
        (id) => ({ label: don.get(id)?.name ?? '—', accent: don.get(id)?.accent }),
      ),
    };
  }
}

/** Cuenta y ordena de más a menos. Lo que no tiene color propio va en gris. */
function count(
  values: readonly string[],
  describe: (value: string) => { label: string; accent?: string },
): DashboardBucket[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

  return [...counts]
    .map(([value, total]) => {
      const { label, accent } = describe(value);
      return { label, accent: accent ?? DEFAULT_CONGREGATION_ACCENT, count: total };
    })
    .sort((uno, otro) => otro.count - uno.count || uno.label.localeCompare(otro.label));
}
