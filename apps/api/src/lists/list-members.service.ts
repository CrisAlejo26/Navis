import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ListMemberships } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { ListMember } from './list-member.entity';
import { List } from './list.entity';

/**
 * Meter, quitar y **ordenar** personas en una lista (RFC 0010 D5, D6).
 *
 * La pertenencia es manual y explícita: no hay listas dinámicas por filtro. El
 * filtro es la herramienta para llenarla; la pertenencia es la decisión, y por
 * eso nadie desaparece de un cartel que lleva circulando desde el domingo
 * porque alguien editara una ficha el martes.
 */
@Injectable()
export class ListMembersService {
  constructor(
    @InjectRepository(ListMember) private readonly members: Repository<ListMember>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(List) private readonly lists: Repository<List>,
  ) {}

  /**
   * Añade varios de golpe, al final y sin repetir. Devuelve cuántos entraron.
   *
   * Entran **en el orden en que llegaron**, no en el que los devuelva la base de
   * datos: un `IN (...)` no garantiza ninguno y en Postgres salía uno y en
   * SQLite el contrario, con el cartel publicado en medio (D6).
   */
  async add(churchId: string, listId: string, believerIds: string[], by: string): Promise<number> {
    const pedidos = [...new Set(believerIds)];
    const validos = new Set(
      (
        await this.believers.find({ where: { id: In(pedidos), churchId }, select: { id: true } })
      ).map((person) => person.id),
    );
    if (validos.size === 0) {
      throw new BadRequestException('Ninguna de esas personas es de esta iglesia');
    }

    const actuales = await this.members.find({ where: { listId } });
    const dentro = new Set(actuales.map((one) => one.believerId));
    const nuevos = pedidos.filter((id) => validos.has(id) && !dentro.has(id));
    if (nuevos.length === 0) return 0;

    let position = actuales.reduce((max, one) => Math.max(max, one.position), -1);

    await this.members.save(
      nuevos.map((believerId) => {
        position += 1;
        return this.members.create({ listId, believerId, position, addedBy: by });
      }),
    );

    return nuevos.length;
  }

  async remove(listId: string, believerId: string): Promise<void> {
    const member = await this.members.findOne({ where: { listId, believerId } });
    if (!member) throw new NotFoundException('Esa persona no está en la lista');

    await this.members.remove(member);
  }

  async setNote(listId: string, believerId: string, note: string | null): Promise<void> {
    const member = await this.members.findOne({ where: { listId, believerId } });
    if (!member) throw new NotFoundException('Esa persona no está en la lista');

    member.note = note?.trim() ? note.trim() : null;
    await this.members.save(member);
  }

  /**
   * El orden **entero**, no «sube uno»: movimientos relativos desde dos sitios
   * a la vez acaban en un orden que no es el de nadie (§7.1). Lo que no venga
   * en la lista se queda detrás, en el orden que tenía.
   */
  async reorder(listId: string, believerIds: readonly string[]): Promise<void> {
    const actuales = await this.members.find({ where: { listId }, order: { position: 'ASC' } });
    const pedido = believerIds.filter((id) => actuales.some((one) => one.believerId === id));
    const resto = actuales.filter((one) => !pedido.includes(one.believerId));

    const orden = [...pedido, ...resto.map((one) => one.believerId)];

    for (const member of actuales) member.position = orden.indexOf(member.believerId);
    await this.members.save(actuales);
  }

  /** Cuántas personas **vivas** hay en cada lista, para las cuentas del tablón. */
  async counts(listIds: readonly string[]): Promise<Map<string, number>> {
    const counts = new Map(listIds.map((id) => [id, 0]));
    if (listIds.length === 0) return counts;

    const rows = await this.members.find({ where: { listId: In([...listIds]) } });
    const vivos = new Set(
      (
        await this.believers.find({
          where: { id: In([...new Set(rows.map((row) => row.believerId))]) },
          select: { id: true },
        })
      ).map((person) => person.id),
    );

    for (const row of rows) {
      if (vivos.has(row.believerId)) counts.set(row.listId, (counts.get(row.listId) ?? 0) + 1);
    }

    return counts;
  }

  /** `{ believerId: [listId] }` de toda la iglesia, en una sola consulta (§8.7). */
  async memberships(churchId: string): Promise<ListMemberships> {
    const listas = await this.lists.find({ where: { churchId }, select: { id: true } });
    if (listas.length === 0) return {};

    const rows = await this.members.find({ where: { listId: In(listas.map((one) => one.id)) } });
    const byBeliever: ListMemberships = {};

    for (const row of rows) {
      byBeliever[row.believerId] = [...(byBeliever[row.believerId] ?? []), row.listId];
    }

    return byBeliever;
  }
}
