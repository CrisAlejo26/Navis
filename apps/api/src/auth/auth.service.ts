import { Injectable, UnauthorizedException } from '@nestjs/common';
import { fromNodeHeaders } from 'better-auth/node';
import type { IncomingHttpHeaders } from 'node:http';

import { auth, type AuthSession } from './auth';

@Injectable()
export class AuthService {
  /** Instancia de Better Auth, por si un módulo necesita su API server-side. */
  readonly instance = auth;

  /** Devuelve la sesión activa o `null` si la petición es anónima. */
  async getSession(headers: IncomingHttpHeaders): Promise<AuthSession | null> {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(headers) });
    return session ?? null;
  }

  /** Igual que `getSession`, pero lanza 401 si no hay sesión. */
  async requireSession(headers: IncomingHttpHeaders): Promise<AuthSession> {
    const session = await this.getSession(headers);
    if (!session) throw new UnauthorizedException('Sesión no válida o expirada');
    return session;
  }

  /** Cierra todas las sesiones de un usuario (por ejemplo al desactivarlo). */
  async revokeUserSessions(headers: IncomingHttpHeaders): Promise<void> {
    await auth.api.revokeSessions({ headers: fromNodeHeaders(headers) });
  }
}
