import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isListShareToken, type PublicList, type PublicListGate } from '@navis/shared';
import { Repository } from 'typeorm';

import { Church } from '../churches/church.entity';
import { ListRowsService } from './list-rows.service';
import type { ListViewer } from './list-viewer.entity';
import { List } from './list.entity';
import { isListShared } from './lists.mapper';
import { parsePublicFields } from './public-fields';
import { toPublicMember } from './public-list.mapper';

/** **404 siempre y el mismo cuerpo**: decir «esto existía» ya es contar algo. */
const NO_ESTA = 'Esta lista ya no está disponible';

/**
 * Lo que se sirve sin sesión (RFC 0010 §7.3).
 *
 * El token no existe, la lista está sin publicar, caducada, borrada, inactiva o
 * es de una iglesia borrada: **todo da el mismo 404**. El 401 y el 403 de D26
 * son la única excepción, y solo aparecen cuando el token sí vale.
 */
@Injectable()
export class PublicListsService {
  constructor(
    @InjectRepository(List) private readonly lists: Repository<List>,
    @InjectRepository(Church) private readonly churches: Repository<Church>,
    private readonly rows: ListRowsService,
  ) {}

  async byToken(token: string): Promise<{ list: List; churchName: string }> {
    // La forma se comprueba antes de ir a la base: un token que no puede existir
    // no merece una consulta, y en Postgres un texto raro contra un índice es
    // exactamente el mismo trabajo que uno bueno.
    if (!isListShareToken(token)) throw new NotFoundException(NO_ESTA);

    const list = await this.lists.findOne({ where: { shareToken: token } });
    if (!list || !isListShared(list)) throw new NotFoundException(NO_ESTA);

    const church = await this.churches.findOne({ where: { id: list.churchId } });
    if (!church) throw new NotFoundException(NO_ESTA);

    return { list, churchName: church.name };
  }

  async payload(list: List, churchName: string, viewer: ListViewer | null): Promise<PublicList> {
    const fields = parsePublicFields(list.publicFields);
    const members = await this.rows.view(list.id);

    return {
      churchName,
      name: list.name,
      description: list.description,
      accent: list.accent,
      updatedAt: list.updatedAt.toISOString(),
      allowDownload: list.allowDownload,
      restricted: list.visibility === 'restricted',
      viewerLabel: viewer?.label ?? null,
      members: members.map((member) => toPublicMember(member, fields)),
    };
  }

  /**
   * La puerta: la iglesia, el nombre de la lista y su color. **Ni el número de
   * personas, ni una sola inicial** —el número también es un dato— (§8.6).
   */
  gate(list: List, churchName: string): PublicListGate {
    return { churchName, name: list.name, accent: list.accent };
  }

  /** Que ese creyente **esté en esta lista**: el quinto cierre de la foto (D17). */
  async hasMember(listId: string, believerId: string): Promise<boolean> {
    return (await this.rows.view(listId)).some((member) => member.believerId === believerId);
  }
}
