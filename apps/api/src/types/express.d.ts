import type { AuthSession, AuthUser } from '../auth/auth';

declare global {
  namespace Express {
    interface Request {
      /** Rellenado por SessionGuard a partir de la sesión de Better Auth. */
      user?: AuthUser;
      session?: AuthSession['session'];
    }
  }
}

export {};
