import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { CreateListViewerInput, UpdateListViewerInput } from '@navis/shared';
import { In, Repository } from 'typeorm';

import { Believer } from '../believers/believer.entity';
import { ListGrantsService } from './list-grants.service';
import { ListPasswordService } from './list-password.service';
import { ListSessionsService } from './list-sessions.service';
import { ListViewer } from './list-viewer.entity';

/**
 * El **directorio de accesos** de la iglesia (RFC 0010 D19, D20, D30).
 *
 * Un acceso puede estar enlazado a un creyente o ser de grupo —«Ancianos»—, y
 * los dos conviven aquí porque son la misma cosa: una llave. Un creyente tiene
 * como mucho uno, y el segundo intento da 409 con un enlace al que existe, no
 * un choque de índice único.
 */
@Injectable()
export class ListViewersService {
  constructor(
    @InjectRepository(ListViewer) private readonly viewers: Repository<ListViewer>,
    @InjectRepository(Believer) private readonly believers: Repository<Believer>,
    private readonly passwords: ListPasswordService,
    private readonly grants: ListGrantsService,
    private readonly sessions: ListSessionsService,
  ) {}

  list(churchId: string): Promise<ListViewer[]> {
    return this.viewers.find({ where: { churchId }, order: { label: 'ASC' } });
  }

  /** Los creyentes de esos accesos, para poner nombre y foto en el directorio. */
  async believersOf(viewers: readonly ListViewer[]): Promise<Map<string, Believer>> {
    const ids = [...new Set(viewers.flatMap((one) => (one.believerId ? [one.believerId] : [])))];
    if (ids.length === 0) return new Map();

    const people = await this.believers.find({ where: { id: In(ids) } });
    return new Map(people.map((person) => [person.id, person]));
  }

  async create(
    churchId: string,
    input: CreateListViewerInput,
    by: string,
  ): Promise<{ viewer: ListViewer; password: string }> {
    await this.assertBeliever(churchId, input.believerId ?? null);
    await this.assertUsername(churchId, input.username);

    const viewer = await this.viewers.save(
      this.viewers.create({
        churchId,
        believerId: input.believerId ?? null,
        username: input.username,
        passwordHash: await this.passwords.hash(input.password),
        label: input.label,
        isActive: true,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        sessionsValidFrom: new Date(),
        createdBy: by,
      }),
    );

    if (input.listIds?.length) await this.grants.setForViewer(viewer.id, input.listIds, by);

    return { viewer, password: input.password };
  }

  async update(churchId: string, id: string, input: UpdateListViewerInput): Promise<ListViewer> {
    const viewer = await this.require(churchId, id);

    if (input.believerId !== undefined) {
      await this.assertBeliever(churchId, input.believerId, id);
      viewer.believerId = input.believerId;
    }
    if (input.label !== undefined) viewer.label = input.label;
    if (input.expiresAt !== undefined) {
      viewer.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }
    // Apagar un acceso echa fuera al momento a quien esté dentro (D28).
    if (input.isActive !== undefined && input.isActive !== viewer.isActive) {
      viewer.isActive = input.isActive;
      if (!input.isActive) viewer.sessionsValidFrom = new Date();
    }

    return this.viewers.save(viewer);
  }

  /** Devuelve la nueva **una sola vez** y corta las sesiones abiertas (D24, D28). */
  async regenerate(churchId: string, id: string, password: string): Promise<string> {
    const viewer = await this.require(churchId, id);

    viewer.passwordHash = await this.passwords.hash(password);
    viewer.sessionsValidFrom = new Date();
    await this.viewers.save(viewer);

    return password;
  }

  /**
   * Borrado lógico que **libera el nombre**: como el índice único es plano, la
   * fila borrada se renombra (`ancianos` → `ancianos#a1b2`). Así nadie se
   * encuentra con un «ese usuario ya existe» señalando a algo que no ve (D30).
   */
  async remove(churchId: string, id: string): Promise<void> {
    const viewer = await this.require(churchId, id);

    await this.grants.removeAllOf({ viewerId: id });

    viewer.username = `${viewer.username}#${crypto.randomUUID().slice(0, 4)}`;
    viewer.sessionsValidFrom = new Date();
    await this.viewers.save(viewer);
    await this.viewers.softRemove(viewer);
    await this.sessions.revoke([id]);
  }

  async require(churchId: string, id: string): Promise<ListViewer> {
    const viewer = await this.viewers.findOne({ where: { id, churchId } });
    if (!viewer) throw new NotFoundException('Ese acceso no existe en esta iglesia');
    return viewer;
  }

  /** De esos identificadores, los que son accesos **de esta iglesia**. */
  async ownedIds(churchId: string, ids: readonly string[]): Promise<string[]> {
    const unicos = [...new Set(ids)].filter(Boolean);
    if (unicos.length === 0) return [];

    const suyos = await this.viewers.find({
      where: { id: In(unicos), churchId },
      select: { id: true },
    });

    return suyos.map((one) => one.id);
  }

  findByUsername(churchId: string, username: string): Promise<ListViewer | null> {
    return this.viewers.findOne({ where: { churchId, username: username.toLowerCase() } });
  }

  async touchLastSeen(id: string): Promise<void> {
    await this.viewers.update({ id }, { lastSeenAt: new Date() });
  }

  /** Un usuario libre a partir del nombre: `juan.perez`, `juan.perez2`… */
  async freeUsername(churchId: string, base: string): Promise<string> {
    for (let intento = 1; ; intento += 1) {
      const username = intento === 1 ? base : `${base}${String(intento)}`;
      if (!(await this.viewers.exists({ where: { churchId, username } }))) return username;
    }
  }

  private async assertUsername(churchId: string, username: string): Promise<void> {
    if (await this.viewers.exists({ where: { churchId, username } })) {
      throw new ConflictException('Ya hay un acceso con ese usuario');
    }
  }

  /** El creyente tiene que ser de la iglesia activa, y se comprueba aquí (D20). */
  private async assertBeliever(
    churchId: string,
    believerId: string | null,
    exceptViewerId?: string,
  ): Promise<void> {
    if (!believerId) return;

    if (!(await this.believers.exists({ where: { id: believerId, churchId } }))) {
      throw new BadRequestException('Esa persona no es de esta iglesia');
    }

    const existing = await this.viewers.findOne({ where: { churchId, believerId } });
    if (existing && existing.id !== exceptViewerId) {
      throw new ConflictException(`Esa persona ya tiene un acceso: ${existing.username}`);
    }
  }
}
