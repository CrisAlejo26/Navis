import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_HIERARCHY, type Role } from '@navis/shared';
import type { Request } from 'express';

import { RolesService } from '../../roles/roles.service';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Comprueba el rol del usuario contra el mínimo exigido por la ruta.
 * Debe ejecutarse después de SessionGuard (que rellena `request.user`).
 *
 * El mínimo se expresa con roles de serie —`@Roles('admin')`—, cuyo nivel está
 * en `ROLE_HIERARCHY`. El nivel de QUIEN pide, en cambio, se busca en la tabla
 * `roles`: puede tener un rol propio de la instalación, que no existe en
 * tiempo de compilación. Un rol que no esté en el catálogo no tiene nivel y no
 * pasa: más vale negar de más que colar a alguien por un slug inventado.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const slug = request.user?.role ?? 'member';
    const minimum = Math.min(...required.map((role) => ROLE_HIERARCHY[role]));
    const level = await this.roles.levelOf(slug);

    if (level === null || level < minimum) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true;
  }
}
