import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  canAssignRoleLevel,
  hasPermission,
  SUPERADMIN_ROLE,
  type CreateManagedUserInput,
  type ManagedUser,
  type RoleSlug,
  type UpdateManagedUserInput,
} from '@navis/shared';

import { auth } from '../auth/auth';
import { ChurchesService, type Asker } from '../churches/churches.service';
import { RolesService } from '../roles/roles.service';
import { UsersService } from './users.service';

/**
 * Cambios sobre una cuenta ajena: datos, rol, contraseña y baja.
 *
 * Se hacen a través del contexto de Better Auth (`auth.$context`) y no con SQL
 * directo: así la contraseña se cifra con el mismo algoritmo que en un alta
 * normal y la baja arrastra sesiones y credenciales. Lo que cuelga del dominio
 * —el perfil— se va solo por la clave foránea `ON DELETE CASCADE`.
 *
 * Todo pasa por el **alcance** de quien pide: se administra a quien comparte
 * iglesia, y el superadministrador a todo el mundo. Un listado acotado con un
 * `PATCH` abierto no acota nada (RFC 0008 §7.3).
 */
@Injectable()
export class UserAdminService {
  constructor(
    private readonly users: UsersService,
    private readonly roles: RolesService,
    private readonly churches: ChurchesService,
  ) {}

  /**
   * La cuenta sobre la que se va a actuar, si se puede actuar sobre ella.
   * Nadie edita la suya desde aquí: para eso está su perfil.
   */
  private async target(id: string, asker: Asker): Promise<ManagedUser> {
    if (id === asker.id) throw new ForbiddenException('Tu propia cuenta se edita desde tu perfil');

    const user = await this.users.findById(id);
    if (!user) throw new NotFoundException('Ese usuario no existe');

    if (!(await this.churches.sharesChurchWith(asker, id))) {
      throw new ForbiddenException('Esa cuenta no es de ninguna de tus iglesias');
    }

    return user;
  }

  /**
   * Nadie asigna un rol igual o por encima del suyo; el superadministrador,
   * que es quien reparte los roles altos, no pasa por esta comprobación
   * (RFC 0014 D1-D2). El nivel sale de la tabla `roles` y no de
   * `ROLE_HIERARCHY`: esa constante no cubre un rol propio de la instalación.
   */
  private async ensureAssignable(role: RoleSlug, asker: Asker): Promise<void> {
    if (asker.role === SUPERADMIN_ROLE) return;

    const [askerLevel, targetLevel] = await Promise.all([
      this.roles.levelOf(asker.role),
      this.roles.levelOf(role),
    ]);

    if (
      askerLevel === null ||
      targetLevel === null ||
      !canAssignRoleLevel(askerLevel, targetLevel)
    ) {
      throw new ForbiddenException('No puedes asignar un rol igual o superior al tuyo');
    }
  }

  /**
   * Si una cuenta con ese rol debe entrar en la iglesia de quien la crea.
   *
   * La regla no mira el slug (`pastor`, `superadmin`): mira si el rol tiene
   * `churches.manage` (RFC 0014 D4). Ese rol se autoprovisiona su propio
   * espacio —nace sin iglesia y pasa por `/welcome`—, así que meterlo en la de
   * quien lo dio de alta sería justo lo que no hay que hacer.
   */
  private async entraEnLaActiva(role: RoleSlug): Promise<boolean> {
    const permissions = await this.roles.permissionsOf(role);
    return !hasPermission(permissions ?? [], 'churches.manage');
  }

  /**
   * Alta hecha desde la administración. La cuenta se crea por la vía normal de
   * Better Auth —misma validación y mismo cifrado de la contraseña que en un
   * registro—, se le pone el rol y, si ese rol no se autoprovisiona su propio
   * espacio (§ `entraEnLaActiva`), **entra en la iglesia activa de quien la
   * crea**: sin eso, quien la ha dado de alta dejaría de verla al instante.
   */
  async create(input: CreateManagedUserInput, asker: Asker): Promise<ManagedUser> {
    await this.roles.ensureExists(input.role);
    await this.ensureAssignable(input.role, asker);

    const ctx = await auth.$context;
    if (await ctx.internalAdapter.findUserByEmail(input.email)) {
      throw new ConflictException('Ya hay una cuenta con ese correo');
    }

    const created = await auth.api.signUpEmail({
      body: { name: input.name, email: input.email, password: input.password },
    });

    await this.forceRole(created.user.id, input.role);
    if (await this.entraEnLaActiva(input.role)) {
      await this.churches.addToActive(asker, created.user.id);
    }

    const user = await this.users.findById(created.user.id);
    if (!user) throw new NotFoundException('La cuenta se creó pero no se pudo leer');
    return user;
  }

  async update(id: string, input: UpdateManagedUserInput, asker: Asker): Promise<ManagedUser> {
    const user = await this.target(id, asker);
    if (input.role) {
      await this.roles.ensureExists(input.role);
      await this.ensureAssignable(input.role, asker);
    }

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
  setRole(id: string, role: RoleSlug, asker: Asker): Promise<ManagedUser> {
    return this.update(id, { role }, asker);
  }

  /** Asigna un rol sin comprobar quién lo pide. Solo para el primer arranque. */
  async forceRole(id: string, role: RoleSlug): Promise<void> {
    const ctx = await auth.$context;
    await ctx.internalAdapter.updateUser(id, { role });
  }

  async setPassword(id: string, password: string, asker: Asker): Promise<void> {
    await this.target(id, asker);

    const ctx = await auth.$context;
    const hash = await ctx.password.hash(password);
    await ctx.internalAdapter.updatePassword(id, hash);
    // Las sesiones abiertas dejan de valer: la contraseña ya no es la suya.
    await ctx.internalAdapter.deleteUserSessions(id);
  }

  /**
   * Baja de la cuenta con todo lo suyo. No se puede borrar el último
   * superadministrador: la instalación se quedaría sin quien reparta accesos.
   */
  async remove(id: string, asker: Asker): Promise<void> {
    const user = await this.target(id, asker);

    if (user.role === SUPERADMIN_ROLE) {
      const superadmins = await this.users.findPage({
        page: 1,
        limit: 2,
        role: SUPERADMIN_ROLE,
        sort: 'createdAt',
        order: 'asc',
      });
      if (superadmins.total <= 1) {
        throw new BadRequestException('Tiene que quedar al menos un superadministrador');
      }
    }

    const ctx = await auth.$context;
    await ctx.internalAdapter.deleteUser(id);
  }
}
