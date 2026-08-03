import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { SUPERADMIN_ROLE, type ManagedUser, type SetupStatus } from '@navis/shared';

import { auth } from '../auth/auth';
import { UserAdminService } from '../users/user-admin.service';
import { UsersService } from '../users/users.service';
import type { CreateFirstAdminDto } from './dto/create-first-admin.dto';

/** Better Auth lanza errores con el detalle en `body.message`. */
function reason(cause: unknown): string {
  if (cause && typeof cause === 'object' && 'body' in cause) {
    const body = (cause as { body?: { message?: unknown } }).body;
    if (typeof body?.message === 'string') return body.message;
  }
  return cause instanceof Error ? cause.message : 'No se pudo crear la cuenta';
}

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(
    private readonly users: UsersService,
    private readonly admin: UserAdminService,
  ) {}

  /** Una instalación sin ninguna cuenta es una instalación sin estrenar. */
  async getStatus(): Promise<SetupStatus> {
    return { needsSetup: (await this.users.count()) === 0 };
  }

  /**
   * Crea la primera cuenta y le da el rol de administrador.
   *
   * La cuenta se crea a través de Better Auth (no con SQL) para que la
   * contraseña se hashee igual que en cualquier alta normal; el rol se pone
   * después porque en la configuración de Better Auth es un campo de solo
   * lectura para el cliente (`input: false`).
   *
   * Solo funciona mientras no haya ninguna cuenta. Dos peticiones a la vez
   * podrían colarse entre la comprobación y el alta: sería un empate entre dos
   * navegadores de la misma persona instalando, y el limitador de peticiones
   * lo hace poco probable. No merece bloquear una tabla que no es nuestra.
   */
  async createFirstAdmin(dto: CreateFirstAdminDto): Promise<ManagedUser> {
    if ((await this.users.count()) > 0) {
      throw new ConflictException('Esta instalación ya tiene cuentas');
    }

    let userId: string;
    try {
      const created = await auth.api.signUpEmail({
        body: { name: dto.name, email: dto.email, password: dto.password },
      });
      userId = created.user.id;
    } catch (cause) {
      throw new BadRequestException(reason(cause));
    }

    await this.admin.forceRole(userId, SUPERADMIN_ROLE);
    this.logger.log(`Primer administrador creado: ${dto.email}`);

    const admin = await this.users.findById(userId);
    if (!admin) throw new BadRequestException('La cuenta se creó pero no se pudo leer');
    return admin;
  }
}
