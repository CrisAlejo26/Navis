import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import type { Paginated, RoleRow, RoleSlug, RolesQuery } from '@navis/shared';
import { DataSource, Repository } from 'typeorm';

import { p } from '../database/sql-params';
import { Role } from './role.entity';

interface RawRole {
  id: string;
  slug: string;
  name: string | null;
  description: string | null;
  level: number;
  is_system: boolean | number;
  users_count: number | string;
}

const toRow = (row: RawRole): RoleRow => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  description: row.description,
  level: Number(row.level),
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
      `SELECT "id", "slug", "name", "description", "level", "is_system",
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

  /** Nivel de un rol cualquiera. Lo usa el guard para comparar jerarquías. */
  async levelOf(slug: RoleSlug): Promise<number | null> {
    const role = await this.roles.findOne({ where: { slug } });
    return role ? role.level : null;
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

  /** Cuántas cuentas tienen ese rol ahora mismo. */
  async countUsers(slug: RoleSlug): Promise<number> {
    const rows = await this.dataSource.query<{ total: number | string }[]>(
      `SELECT COUNT(*) AS "total" FROM "user" WHERE "role" = ${p(1)}`,
      [slug],
    );
    return Number(rows[0]?.total ?? 0);
  }
}
