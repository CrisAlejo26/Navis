import type { AuthSession, AuthUser } from '../auth/auth';

declare global {
  namespace Express {
    interface Request {
      /** Rellenado por SessionGuard a partir de la sesión de Better Auth. */
      user?: AuthUser;
      session?: AuthSession['session'];
      /** Rellenado por ActiveChurchGuard en los módulos acotados por iglesia. */
      churchId?: string;
    }
  }
}

export {};
