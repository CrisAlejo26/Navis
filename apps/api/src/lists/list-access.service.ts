import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { ListAccessOutcome, PublicListAccessInput } from '@navis/shared';
import { Repository } from 'typeorm';

import { ListAccessLog } from './list-access-log.entity';
import { readListCookie, type ListSession } from './list-access.cookie';
import { ListGrantsService } from './list-grants.service';
import { ListPasswordService } from './list-password.service';
import { ListViewer } from './list-viewer.entity';
import { ListViewersService } from './list-viewers.service';
import { isViewerUsable } from './list-viewers.mapper';
import { noteTry, retryAfterMs } from './list-throttle';
import { ipPrefix } from './visitor';

/**
 * La puerta de una lista restringida (RFC 0010 D26, D27).
 *
 * Autenticar y autorizar son **dos pasos y dos mensajes**: primero quién eres,
 * después si esta lista es tuya. Los dos primeros casos —usuario que no existe y
 * contraseña incorrecta— dan el mismo texto a propósito: distinguirlos
 * convertiría el formulario en una máquina de averiguar qué usuarios existen.
 */
@Injectable()
export class ListAccessService {
  constructor(
    @InjectRepository(ListViewer) private readonly viewers: Repository<ListViewer>,
    @InjectRepository(ListAccessLog) private readonly log: Repository<ListAccessLog>,
    private readonly passwords: ListPasswordService,
    private readonly grants: ListGrantsService,
    private readonly directory: ListViewersService,
  ) {}

  async enter(
    list: { id: string; churchId: string },
    input: PublicListAccessInput,
    ip: string,
  ): Promise<ListViewer> {
    const prefix = ipPrefix(ip);
    const key = `${prefix}|${list.id}`;

    const falta = retryAfterMs(key);
    if (falta > 0) {
      await this.note(list.id, null, input.username, 'throttled', prefix);
      // El tiempo que falta va en `data` y no como campo suelto: el filtro de
      // excepciones normaliza el cuerpo y solo `data` viaja entero (§7.3).
      throw new HttpException(
        {
          message: 'Has probado demasiadas veces',
          data: { retryAfterMs: falta },
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const viewer = await this.directory.findByUsername(list.churchId, input.username);
    // Se compara **igual** cuando el usuario no existe, contra un hash de
    // mentira: tardar menos delataría que ese usuario no está (D24).
    const acierta = await this.passwords.verify(input.password, viewer?.passwordHash ?? null);
    const bueno = viewer !== null && acierta && isViewerUsable(viewer);

    const espera = noteTry(key, bueno);
    if (espera > 0) await new Promise((resolve) => setTimeout(resolve, espera));

    if (!bueno) {
      await this.note(list.id, viewer?.id ?? null, input.username, 'bad_credentials', prefix);
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    if (!(await this.grants.has(viewer.id, list.id))) {
      await this.note(list.id, viewer.id, input.username, 'no_grant', prefix);
      throw new ForbiddenException('Este acceso no incluye esta lista');
    }

    await this.note(list.id, viewer.id, input.username, 'ok', prefix);
    await this.directory.touchLastSeen(viewer.id);

    return viewer;
  }

  /**
   * Quién es quien trae la cookie, **volviendo a consultar `list_grants`**
   * (D23). Devuelve `null` cuando no hay sesión válida —la puerta— y lanza 403
   * cuando la hay y esta lista no es suya: quien ya entró en otra no tiene que
   * volver a escribir la contraseña para que le digan que no.
   */
  async sessionFor(list: { id: string }, cookie: string | undefined): Promise<ListViewer | null> {
    const session = readListCookie(cookie);
    if (!session) return null;

    const viewer = await this.viewers.findOne({ where: { id: session.viewerId } });
    if (!viewer || !isViewerUsable(viewer) || !sigueValiendo(viewer, session)) return null;

    if (!(await this.grants.has(viewer.id, list.id))) {
      throw new ForbiddenException('Este acceso no incluye esta lista');
    }

    return viewer;
  }

  private async note(
    listId: string,
    viewerId: string | null,
    username: string,
    outcome: ListAccessOutcome,
    ipPrefixValue: string,
  ): Promise<void> {
    await this.log.save(
      this.log.create({
        listId,
        viewerId,
        // Lo que se tecleó, para poder leer el registro. **Nunca la contraseña.**
        username: username.slice(0, 60),
        outcome,
        ipPrefix: ipPrefixValue,
        at: new Date(),
      }),
    );
  }
}

/** Una cookie emitida antes de la última revocación ya no vale (D28). */
function sigueValiendo(viewer: ListViewer, session: ListSession): boolean {
  return session.issuedAt.getTime() >= viewer.sessionsValidFrom.getTime();
}
