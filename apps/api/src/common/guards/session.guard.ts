import {
  CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { AuthService } from '../../auth/auth.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Guard global: resuelve la sesión de Better Auth en cada petición y la deja
 * en `request.user` / `request.session`. Las rutas marcadas con `@Public()`
 * siguen pasando por aquí (para poder saber quién es el usuario si lo hay),
 * pero no exigen sesión.
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.authService.getSession(request.headers);

    if (session) {
      request.user = session.user;
      request.session = session.session;
      return true;
    }

    if (isPublic) return true;

    throw new UnauthorizedException('Necesitas iniciar sesión');
  }
}
