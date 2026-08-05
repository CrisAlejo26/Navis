import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ListViewer } from './list-viewer.entity';

/**
 * Cortar las cookies ya emitidas, y nada más (RFC 0010 D28).
 *
 * Es un servicio de una línea a propósito: lo necesitan **los dos lados** —quien
 * gestiona accesos y quien gestiona concesiones—, y tenerlo en cualquiera de
 * ellos dejaría a los dos importándose el uno al otro.
 *
 * `sessions_valid_from` se pone a la hora actual al regenerar la contraseña,
 * desactivar el acceso, borrarlo, quitarle una concesión o despublicar la
 * lista. Quitar **una** concesión no lo necesitaría —la comprobación contra
 * `list_grants` de D23 ya lo cubre en la petición siguiente— y aun así se toca,
 * porque el coste es cero y así «revocar» significa lo mismo en los cinco
 * casos. Lo que nadie espera al pulsar «Revocar» es que tarde doce horas.
 */
@Injectable()
export class ListSessionsService {
  constructor(@InjectRepository(ListViewer) private readonly viewers: Repository<ListViewer>) {}

  async revoke(viewerIds: readonly string[]): Promise<void> {
    const ids = [...new Set(viewerIds)].filter(Boolean);
    if (ids.length === 0) return;

    await this.viewers.update({ id: In(ids) }, { sessionsValidFrom: new Date() });
  }
}
