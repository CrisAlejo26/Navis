import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ListGrant } from './list-grant.entity';
import { ListSessionsService } from './list-sessions.service';

/**
 * Qué acceso abre qué lista (RFC 0010 D19).
 *
 * **Es la única tabla que decide si alguien puede leer una lista restringida**,
 * y se consulta en cada petición (D23): por eso `has` es una búsqueda por clave
 * primaria y no una consulta con lógica dentro.
 *
 * Los dos `set` escriben lo mismo desde los dos lados —«a qué llega este
 * acceso» y «quién entra en esta lista»—, que es como se mira de verdad.
 */
@Injectable()
export class ListGrantsService {
  constructor(
    @InjectRepository(ListGrant) private readonly grants: Repository<ListGrant>,
    private readonly sessions: ListSessionsService,
  ) {}

  has(viewerId: string, listId: string): Promise<boolean> {
    return this.grants.exists({ where: { viewerId, listId } });
  }

  async listsOf(viewerIds: readonly string[]): Promise<Map<string, string[]>> {
    const byViewer = new Map<string, string[]>();
    const ids = [...new Set(viewerIds)].filter(Boolean);
    if (ids.length === 0) return byViewer;

    for (const grant of await this.grants.find({ where: { viewerId: In(ids) } })) {
      byViewer.set(grant.viewerId, [...(byViewer.get(grant.viewerId) ?? []), grant.listId]);
    }

    return byViewer;
  }

  async viewersOf(listId: string): Promise<string[]> {
    return (await this.grants.find({ where: { listId } })).map((grant) => grant.viewerId);
  }

  /** Las listas que abre un acceso, escritas de una vez. */
  async setForViewer(viewerId: string, listIds: readonly string[], by: string): Promise<void> {
    const wanted = new Set(listIds);
    const current = await this.grants.find({ where: { viewerId } });

    await this.apply(
      current.filter((grant) => !wanted.has(grant.listId)),
      [...wanted]
        .filter((listId) => !current.some((grant) => grant.listId === listId))
        .map((listId) => ({ viewerId, listId, grantedBy: by })),
      [viewerId],
    );
  }

  /** Quién entra en una lista, escrito de una vez. Lo mismo, girado. */
  async setForList(listId: string, viewerIds: readonly string[], by: string): Promise<void> {
    const wanted = new Set(viewerIds);
    const current = await this.grants.find({ where: { listId } });
    const quitados = current.filter((grant) => !wanted.has(grant.viewerId));

    await this.apply(
      quitados,
      [...wanted]
        .filter((viewerId) => !current.some((grant) => grant.viewerId === viewerId))
        .map((viewerId) => ({ viewerId, listId, grantedBy: by })),
      quitados.map((grant) => grant.viewerId),
    );
  }

  /**
   * Al borrar una lista o un acceso —los dos son borrado **lógico**, así que el
   * `ON DELETE CASCADE` no se dispara— sus concesiones se quitan a mano (§6.4).
   */
  async removeAllOf(where: { listId?: string; viewerId?: string }): Promise<string[]> {
    const current = await this.grants.find({ where });
    if (current.length === 0) return [];

    const afectados = current.map((grant) => grant.viewerId);
    await this.apply(current, [], afectados);

    return afectados;
  }

  private async apply(
    quitar: ListGrant[],
    poner: { viewerId: string; listId: string; grantedBy: string }[],
    revocar: readonly string[],
  ): Promise<void> {
    if (quitar.length > 0) await this.grants.remove(quitar);
    if (poner.length > 0) await this.grants.save(this.grants.create(poner));
    // Quitar una concesión revoca al instante: ver `ListSessionsService`.
    if (quitar.length > 0) await this.sessions.revoke(revocar);
  }
}
