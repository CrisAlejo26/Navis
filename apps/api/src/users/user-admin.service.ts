import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateManagedUserInput,
  ManagedUser,
  RoleSlug,
  UpdateManagedUserInput,
} from '@navis/shared';

import { auth } from '../auth/auth';
import { RolesService } from '../roles/roles.service';
import { UsersService } from './users.service';

/**
 * Cambios sobre una cuenta ajena: datos, rol, contraseña y baja.
 *
 * Se hacen a través del contexto de Better Auth (`auth.$context`) y no con SQL
 * directo: así la contraseña se cifra con el mismo algoritmo que en un alta
 * normal y la baja arrastra sesiones y credenciales. Lo que cuelga del dominio
 * —el perfil— se va solo por la clave foránea `ON DELETE CASCADE`.
 */
@Injectable()
export class UserAdminService {
  constructor(
    private readonly users: UsersService,
    private readonly roles: RolesService,
  ) {}

  /** Nadie edita su propia cuenta desde aquí: para eso está su perfil. */
  private async target(id: string, actorId: string): Promise<ManagedUser> {
    if (id === actorId) throw new ForbiddenException('Tu propia cuenta se edita desde tu perfil');

    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Ese usuario no existe');
    return user;
  }

  /**
   * Alta hecha por un administrador. La cuenta se crea por la vía normal de
   * Better Auth —misma validación y mismo cifrado de la contraseña que en un
   * registro— y después se le pone el rol, que es de solo lectura para el
   * cliente.
   */
  async create(input: CreateManagedUserInput): Promise<ManagedUser> {
    await this.roles.ensureExists(input.role);

    const ctx = await auth.$context;
    if (await ctx.internalAdapter.findUserByEmail(input.email)) {
      throw new ConflictException('Ya hay una cuenta con ese correo');
    }

    const created = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });

    await this.forceRole(created.user.id, input.role);

    const user = await this.users.findById(created.user.id);
    if (!user) throw new NotFoundException('La cuenta se creó pero no se pudo leer');
    return user;
  }

  async update(id: string, input: UpdateManagedUserInput, actorId: string): Promise<ManagedUser> {
    const user = await this.target(id, actorId);
    if (input.role) await this.roles.ensureExists(input.role);

    if (input.email && input.email !== user.email) {
      const ctx = await auth.$context;
      const taken = await ctx.internalAdapter.findUserByEmail(input.email);
      if (taken) throw new ConflictException('Ya hay una cuenta con ese correo');
    }

    const ctx = await auth.$context;
    await ctx.internalAdapter.updateUser(id, input);

    const updated = await this.users.findById(id);
    if (!updated) throw new NotFoundException('Ese usuario no existe');
    return updated;
  }

  /** Atajo para el cambio de rol, que es la acción más habitual. */
  setRole(id: string, role: RoleSlug, actorId: string): Promise<ManagedUser> {
    return this.update(id, { role }, actorId);
  }

  /** Asigna un rol sin comprobar quién lo pide. Solo para el primer arranque. */
  async forceRole(id: string, role: RoleSlug): Promise<void> {
    const ctx = await auth.$context;
    await ctx.internalAdapter.updateUser(id, { role });
  }

  async setPassword(id: string, password: string, actorId: string): Promise<void> {
    await this.target(id, actorId);

    const ctx = await auth.$context;
    const hash = await ctx.password.hash(password);
    await ctx.internalAdapter.updatePassword(id, hash);
    // Las sesiones abiertas dejan de valer: la contraseña ya no es la suya.
    await ctx.internalAdapter.deleteUserSessions(id);
  }

  /**
   * Baja de la cuenta con todo lo suyo. No se puede borrar el último
   * administrador: la instalación se quedaría sin quien reparta accesos.
   */
  async remove(id: string, actorId: string): Promise<void> {
    const user = await this.target(id, actorId);

    if (user.role === 'admin') {
      const admins = await this.users.findPage({
        page: 1,
        limit: 2,
        role: 'admin',
        sort: 'createdAt',
        order: 'asc',
      });
      if (admins.total <= 1) {
        throw new BadRequestException('Tiene que quedar al menos un administrador');
      }
    }

    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUser(id);
  }
}
