import { CanActivate, type ExecutionContext, Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_ROLE } from '@navis/shared';
import type { Request } from 'express';

import { ChurchesService } from '../../churches/churches.service';

/**
 * Resuelve la iglesia activa de quien pide y la deja en la petición, para que
 * `@CurrentChurch()` la lea sin volver a preguntar a la base de datos.
 *
 * Va en los controladores de los módulos acotados —calendario y creyentes—, no
 * como guard global: hay rutas que existen precisamente para cuando todavía no
 * hay ninguna iglesia (`/churches`, `/setup`) y ahí esto sería un 404 en la
 * cara de quien acaba de registrarse.
 */
@Injectable()
export class ActiveChurchGuard implements CanActivate {
  constructor(private readonly churches: ChurchesService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user;
    if (!user) return false;

    const churchId = await this.churches.activeIdFor({
      id: user.id,
      role: user.role ?? DEFAULT_ROLE,
    });
    if (!churchId) throw new NotFoundException('Todavía no tienes ninguna iglesia');

    request.churchId = churchId;
    return true;
  }
}
