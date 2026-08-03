import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_HIERARCHY, type Role } from '@navis/shared';
import type { Request } from 'express';

import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Comprueba el rol del usuario contra el mínimo exigido por la ruta.
 * Debe ejecutarse después de SessionGuard (que rellena `request.user`).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const role = (request.user?.role ?? 'member') as Role;
    const minimum = Math.min(...required.map((r) => ROLE_HIERARCHY[r]));

    if (ROLE_HIERARCHY[role] < minimum) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true;
  }
}
