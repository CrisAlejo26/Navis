import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  MAX_CUSTOM_ROLE_LEVEL,
  toRoleSlug,
  type CreateRoleInput,
  type RoleRow,
  type UpdateRoleInput,
} from '@navis/shared';
import { Repository } from 'typeorm';

import { Role } from './role.entity';
import { RolesService } from './roles.service';

/**
 * Alta, edición y baja de roles. Va por el repositorio de TypeORM, al revés
 * que el listado, que necesita contar cuentas de la tabla de Better Auth.
 */
@Injectable()
export class RoleAdminService {
  constructor(
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    private readonly catalog: RolesService,
  ) {}

  /** El slug se deriva del nombre una sola vez y ya no cambia: hay cuentas que lo referencian. */
  async create(input: CreateRoleInput): Promise<RoleRow> {
    const slug = toRoleSlug(input.name);
    if (slug.length < 2) {
      throw new BadRequestException('Del nombre no sale un identificador válido');
    }
    if (await this.roles.exists({ where: { slug } })) {
      throw new ConflictException('Ya hay un rol con ese nombre');
    }

    const role = await this.roles.save(
      this.roles.create({
        slug,
        name: input.name,
        description: input.description ?? null,
        level: input.level,
        isSystem: false,
      }),
    );

    return { ...role, usersCount: 0 };
  }

  /**
   * De los roles de serie solo se cambia la descripción: tocarles el nivel o
   * el nombre descolocaría la jerarquía que comparan los guards y la
   * traducción que enseña la interfaz.
   */
  async update(id: string, input: UpdateRoleInput): Promise<RoleRow> {
    const role = await this.find(id);

    if (role.isSystem && (input.name !== undefined || input.level !== undefined)) {
      throw new BadRequestException('De un rol de serie solo se cambia la descripción');
    }
    if (input.level !== undefined && input.level > MAX_CUSTOM_ROLE_LEVEL) {
      throw new BadRequestException('Un rol propio no puede llegar a administrador');
    }

    if (input.name !== undefined) role.name = input.name;
    if (input.description !== undefined) role.description = input.description;
    if (input.level !== undefined) role.level = input.level;

    await this.roles.save(role);
    return { ...role, usersCount: await this.catalog.countUsers(role.slug) };
  }

  /** Baja de un rol propio. Ni los de serie ni los que alguien tenga puesto. */
  async remove(id: string): Promise<void> {
    const role = await this.find(id);
    if (role.isSystem) throw new BadRequestException('Los roles de serie no se borran');

    if ((await this.catalog.countUsers(role.slug)) > 0) {
      throw new ConflictException('Hay cuentas con ese rol: cámbialas antes de borrarlo');
    }

    await this.roles.softRemove(role);
  }

  private async find(id: string): Promise<Role> {
    const role = await this.roles.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Ese rol no existe');
    return role;
  }
}
