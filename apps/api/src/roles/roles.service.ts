import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  hasPermission,
  type MyRole,
  type Paginated,
  type Permission,
  type RoleRow,
  type RoleSlug,
  type RolesQuery,
} from '@navis/shared';
import { DataSource, Repository } from 'typeorm';

import { p } from '../database/sql-params';
import { Role } from './role.entity';

interface RawRole {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  level: number;
  permissions: string | null;
  is_system: boolean | number;
  users_count: number | string;
}

/**
 * La columna es texto en los dos motores (`simple-json`), y aquí se lee con SQL
 * a mano, así que el JSON llega sin parsear. Si lo que hay no es una lista de
 * textos, el rol se queda sin permisos: mejor que reventar el listado entero.
 */
function parsePermissions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

const toRow = (row: RawRole): RoleRow => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  level: Number(row.level),
  permissions: parsePermissions(row.permissions),
  isSystem: Boolean(row.is_system),
  usersCount: Number(row.users_count),
});

/** Solo se ordena por columnas de esta lista: el resto no llega hasta aquí. */
const SORT_COLUMN = {
  slug: '"slug"',
  level: '"level"',
  usersCount: '"users_count"',
} as const;

/**
 * Consulta del catálogo de roles. El alta, la edición y la baja viven en
 * RoleAdminService; aquí está lo que se lee, incluido lo que necesita el guard.
 */
@Injectable()
export class RolesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
  ) {}

  /**
   * Catálogo con el número de cuentas que tiene cada rol.
   *
   * El recuento sale de una subconsulta contra la tabla `user` de Better Auth,
   * que no tiene entidad de TypeORM; por eso el listado va en SQL a mano y no
   * con el repositorio.
   */
  async findPage(query: RolesQuery): Promise<Paginated<RoleRow>> {
    const params: unknown[] = [];
    let where = `WHERE "deleted_at" IS NULL`;

    if (query.search) {
      // El patrón se pasa una vez por comparación: en SQLite cada `?` es un
      // parámetro distinto y reutilizar el marcador tumba la consulta.
      const pattern = `%${query.search.toLowerCase()}%`;
      params.push(pattern, pattern);
      where +=
        ` AND (LOWER("slug") LIKE ${p(params.length - 1)}` +
        ` OR LOWER(COALESCE("name", '')) LIKE ${p(params.length)})`;
    }

    const totals = await this.dataSource.query<{ total: number | string }[]>(
      `SELECT COUNT(*) AS "total" FROM "roles" ${where}`,
      params,
    );
    const total = Number(totals[0]?.total ?? 0);

    const order = query.order === 'desc' ? 'DESC' : 'ASC';
    const offset = (query.page - 1) * query.limit;
    const rows = await this.dataSource.query<RawRole[]>(
      `SELECT "id", "slug", "name", "description", "level", "permissions", "is_system",
              (SELECT COUNT(*) FROM "user" WHERE "user"."role" = "roles"."slug") AS "users_count"
       FROM "roles" ${where}
       ORDER BY ${SORT_COLUMN[query.sort]} ${order}
       LIMIT ${p(params.length + 1)} OFFSET ${p(params.length + 2)}`,
      [...params, query.limit, offset],
    );

    return {
      items: rows.map(toRow),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }

  /**
   * Los permisos de un rol, o `null` si ese rol no está en el catálogo. Es lo
   * que compara PermissionsGuard en cada petición.
   */
  async permissionsOf(slug: RoleSlug): Promise<string[] | null> {
    const role = await this.roles.findOne({ where: { slug } });
    return role ? role.permissions : null;
  }

  /** El rol de quien pregunta, con sus permisos: es lo que pinta el menú. */
  async mine(slug: RoleSlug): Promise<MyRole> {
    return { slug, permissions: (await this.permissionsOf(slug)) ?? [] };
  }

  /**
   * Comprueba que el rol existe antes de asignárselo a nadie. Cubre tanto un
   * slug inventado como una instalación cuya semilla se quedó a medias.
   */
  async ensureExists(slug: RoleSlug): Promise<void> {
    if (!(await this.roles.exists({ where: { slug } }))) {
      throw new BadRequestException(`El rol "${slug}" no existe`);
    }
  }

  /**
   * El nivel de ese rol, o `null` si no está en el catálogo.
   *
   * Es lo que compara el tope de asignación (RFC 0014 D1): sale de la tabla y
   * no de `ROLE_HIERARCHY`, que solo cubre los siete roles de serie y no un rol
   * propio de la instalación.
   */
  async levelOf(slug: RoleSlug): Promise<number | null> {
    const role = await this.roles.findOne({ where: { slug } });
    return role ? role.level : null;
  }

  /**
   * Los slugs de rol que dan ese permiso, ahora mismo. Es lo que resuelve
   * `ChatParticipantsService` para saber quién entra a Comunicaciones (RFC
   * 0016 §2): se lee de la tabla y no de `ROLE_PERMISSIONS`, que es solo la
   * semilla y no lo que hay tras editar los permisos desde la administración.
   */
  async rolesWithPermission(permission: Permission): Promise<RoleSlug[]> {
    const roles = await this.roles.find();
    return roles
      .filter((role) => hasPermission(role.permissions, permission))
      .map((role) => role.slug);
  }

  /** Cuántas cuentas tienen ese rol ahora mismo. */
  async countUsers(slug: RoleSlug): Promise<number> {
    const rows = await this.dataSource.query<{ total: number | string }[]>(
      `SELECT COUNT(*) AS "total" FROM "user" WHERE "role" = ${p(1)}`,
      [slug],
    );
    return Number(rows[0]?.total ?? 0);
  }
}
