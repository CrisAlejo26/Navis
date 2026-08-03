import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  SUPERADMIN_ROLE,
  toSlug,
  type CreateChurchInput,
  type MyChurches,
  type UpdateChurchInput,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { ProfilesService } from '../profiles/profiles.service';
import { ChurchMember } from './church-member.entity';
import { Church } from './church.entity';

/** Quién pregunta: lo mínimo del usuario para decidir a qué llega. */
export interface Asker {
  id: string;
  role: string;
}

/**
 * Las iglesias de cada cuenta y en cuál está trabajando.
 *
 * Dos reglas y ninguna más:
 *   · el superadministrador llega a todas;
 *   · el resto, solo a aquellas en las que tiene fila de pertenencia.
 */
@Injectable()
export class ChurchesService {
  constructor(
    @InjectRepository(Church) private readonly churches: Repository<Church>,
    @InjectRepository(ChurchMember) private readonly members: Repository<ChurchMember>,
    private readonly profiles: ProfilesService,
  ) {}

  /** Las iglesias a las que llega, con la activa resuelta y corregida si hacía falta. */
  async listFor(asker: Asker): Promise<MyChurches> {
    const items = await this.accessible(asker);
    return { items, activeId: await this.resolveActive(asker.id, items) };
  }

  /**
   * Alta. Quien la crea queda como dueño **y** como miembro —el dueño es un
   * miembro más, con una marca—, y la iglesia nueva pasa a ser la activa: se
   * acaba de crear para trabajar en ella.
   */
  async create(asker: Asker, input: CreateChurchInput): Promise<Church> {
    const profile = await this.profiles.findOrCreate(asker.id);

    const church = await this.churches.save(
      this.churches.create({
        name: input.name,
        slug: await this.freeSlug(input.name),
        city: input.city,
        // La de quien la crea: es quien va a mirar el calendario a diario.
        timezone: profile.timezone,
        ownerId: asker.id,
      }),
    );

    await this.members.save(this.members.create({ churchId: church.id, userId: asker.id }));
    await this.profiles.setActiveChurch(asker.id, church.id);

    return church;
  }

  /**
   * Edita la ficha. El `slug` **no** cambia con el nombre: es el identificador
   * estable, y lo que hoy solo sale en registros mañana estará en una URL.
   */
  async update(asker: Asker, churchId: string, input: UpdateChurchInput): Promise<Church> {
    const items = await this.accessible(asker);
    const church = items.find((row) => row.id === churchId);
    if (!church) throw new ForbiddenException('No perteneces a esa iglesia');

    if (input.name !== undefined) church.name = input.name;
    if (input.city !== undefined) church.city = input.city;
    if (input.timezone !== undefined) church.timezone = input.timezone;

    return this.churches.save(church);
  }

  /** Cambia la iglesia activa, comprobando antes que se llega a ella. */
  async setActive(asker: Asker, churchId: string): Promise<MyChurches> {
    const items = await this.accessible(asker);
    if (!items.some((church) => church.id === churchId)) {
      throw new ForbiddenException('No perteneces a esa iglesia');
    }

    await this.profiles.setActiveChurch(asker.id, churchId);
    return { items, activeId: churchId };
  }

  /**
   * La iglesia sobre la que trabaja esta cuenta ahora mismo. Es lo que acotará
   * las consultas de creyentes, calendario y comunicaciones.
   */
  async activeIdFor(asker: Asker): Promise<string> {
    const { activeId } = await this.listFor(asker);
    if (!activeId) throw new NotFoundException('Todavía no tienes ninguna iglesia');
    return activeId;
  }

  /**
   * El alcance de quien pregunta: los ids de las iglesias cuyas cosas puede
   * ver. `null` es «todas», y solo lo tiene el superadministrador.
   *
   * `only` acota todavía más, para el filtro de la interfaz: si pide una
   * iglesia a la que no llega, se queda sin ninguna en vez de recibir un error
   * —el filtro es una preferencia guardada y puede haber envejecido—.
   */
  async scopeFor(asker: Asker, only?: string): Promise<string[] | null> {
    if (asker.role === SUPERADMIN_ROLE) return only ? [only] : null;

    const ids = (await this.accessible(asker)).map((church) => church.id);
    return only ? ids.filter((id) => id === only) : ids;
  }

  /** Si esa cuenta está en alguna de las iglesias de quien pregunta. */
  async sharesChurchWith(asker: Asker, userId: string): Promise<boolean> {
    const scope = await this.scopeFor(asker);
    if (scope === null) return true;
    if (scope.length === 0) return false;

    return this.members.exists({ where: { churchId: In(scope), userId } });
  }

  /** Mete una cuenta recién creada en la iglesia en la que trabaja quien la crea. */
  async addToActive(asker: Asker, userId: string): Promise<void> {
    const { activeId } = await this.listFor(asker);
    if (!activeId) return;

    const yaEsta = await this.members.exists({ where: { churchId: activeId, userId } });
    if (!yaEsta) {
      await this.members.save(this.members.create({ churchId: activeId, userId }));
    }
  }

  private async accessible(asker: Asker): Promise<Church[]> {
    const order = { name: 'ASC' } as const;

    if (asker.role === SUPERADMIN_ROLE) return this.churches.find({ order });

    const memberships = await this.members.find({ where: { userId: asker.id } });
    if (memberships.length === 0) return [];

    return this.churches.find({
      where: { id: In(memberships.map((member) => member.churchId)) },
      order,
    });
  }

  /**
   * La guardada, si sigue valiendo; si no, la primera a la que llega —y se
   * corrige, porque una preferencia que apunta a una iglesia que ya no está
   * volvería a fallar en cada petición—.
   */
  private async resolveActive(userId: string, items: Church[]): Promise<string | null> {
    if (items.length === 0) return null;

    const profile = await this.profiles.findOrCreate(userId);
    const saved = profile.activeChurchId;
    if (saved && items.some((church) => church.id === saved)) return saved;

    const first = items[0]?.id ?? null;
    if (first) await this.profiles.setActiveChurch(userId, first);
    return first;
  }

  /** `Iglesia Central`, `iglesia-central-2`… Dos congregaciones pueden llamarse igual. */
  private async freeSlug(name: string): Promise<string> {
    const base = toSlug(name) || 'iglesia';

    for (let intento = 1; ; intento += 1) {
      const slug = intento === 1 ? base : `${base}-${String(intento)}`;
      if (!(await this.churches.exists({ where: { slug } }))) return slug;
    }
  }
}
