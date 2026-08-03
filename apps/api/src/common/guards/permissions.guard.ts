import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DEFAULT_ROLE, hasEveryPermission, type Permission } from '@navis/shared';
import type { Request } from 'express';

import { RolesService } from '../../roles/roles.service';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Comprueba los permisos del rol de quien pide contra los que exige la ruta.
 * Debe ejecutarse después de SessionGuard (que rellena `request.user`).
 *
 * Los permisos no están en la sesión: se leen de la tabla `roles`, que es donde
 * se pueden cambiar en caliente desde la administración de accesos. Un rol que
 * no esté en el catálogo no tiene permisos y no pasa: más vale negar de más que
 * colar a alguien por un slug inventado.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly roles: RolesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required?.length) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const slug = request.user?.role ?? DEFAULT_ROLE;
    const granted = await this.roles.permissionsOf(slug);

    if (!granted || !hasEveryPermission(granted, required)) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    return true;
  }
}
