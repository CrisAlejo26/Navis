import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  believerName,
  generateListPassword,
  proposeListUsername,
  type ListCredentialSheetRow,
} from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { ListGrantsService } from './list-grants.service';
import { ListMember } from './list-member.entity';
import { ListViewer } from './list-viewer.entity';
import { ListViewersService } from './list-viewers.service';

/**
 * **«Dar acceso a los de esta lista»** (RFC 0010 D29).
 *
 * Es un atajo **explícito y confirmado**, no un automatismo: estar en una lista
 * y poder verla siguen siendo cosas distintas (D21). Crea un acceso por persona
 * de las que **no** tengan ya uno, les concede **esa** lista, y devuelve la hoja
 * de credenciales, que es el único sitio de todo el proyecto donde una
 * contraseña sale a un fichero.
 */
@Injectable()
export class ListViewersBulkService {
  constructor(
    @InjectRepository(ListMember) private readonly members: Repository<ListMember>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    @InjectRepository(ListViewer) private readonly viewers: Repository<ListViewer>,
    private readonly directory: ListViewersService,
    private readonly grants: ListGrantsService,
  ) {}

  /** A quién afectaría: los miembros vivos que todavía no tienen acceso. */
  async candidates(churchId: string, listId: string): Promise<Believer[]> {
    const rows = await this.members.find({ where: { listId }, order: { position: 'ASC' } });
    if (rows.length === 0) return [];

    const people = await this.believers.find({
      where: { id: In(rows.map((row) => row.believerId)), churchId },
    });
    if (people.length === 0) return [];

    const conAcceso = new Set(
      (
        await this.viewers.find({
          where: { churchId, believerId: In(people.map((one) => one.id)) },
        })
      ).map((one) => one.believerId),
    );

    const orden = new Map(rows.map((row, index) => [row.believerId, index]));

    return people
      .filter((person) => !conAcceso.has(person.id))
      .sort((uno, otro) => (orden.get(uno.id) ?? 0) - (orden.get(otro.id) ?? 0));
  }

  async run(churchId: string, listId: string, by: string): Promise<ListCredentialSheetRow[]> {
    const sheet: ListCredentialSheetRow[] = [];

    for (const person of await this.candidates(churchId, listId)) {
      const name = believerName(person);
      const password = generateListPassword();

      const { viewer } = await this.directory.create(
        churchId,
        {
          label: name,
          username: await this.directory.freeUsername(churchId, proposeListUsername(name)),
          password,
          believerId: person.id,
        },
        by,
      );

      await this.grants.setForViewer(viewer.id, [listId], by);
      sheet.push({ name, username: viewer.username, password });
    }

    return sheet;
  }
}
