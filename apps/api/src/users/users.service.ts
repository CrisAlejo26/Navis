import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import {
  DEFAULT_ROLE,
  type ManagedUser,
  type ManagedUsersQuery,
  type Paginated,
} from '@navis/shared';
import { DataSource } from 'typeorm';

import { p } from '../database/sql-params';

/** Fila cruda de la tabla `user`: SQLite devuelve 0/1 y fechas en texto. */
interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string | null;
  emailVerified: boolean | number;
  createdAt: string | Date;
}

const toManagedUser = (row: UserRow): ManagedUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  // Sin rol no significa sin permisos: Better Auth deja el campo vacío en las
  // cuentas antiguas y el mínimo de la casa es `member`.
  role: row.role ?? DEFAULT_ROLE,
  emailVerified: Boolean(row.emailVerified),
  createdAt: new Date(row.createdAt),
});

const COLUMNS = `"id", "name", "email", "role", "emailVerified", "createdAt"`;

/** Una página sin nada, para cuando el alcance ya deja claro que no hay filas. */
const empty = (query: ManagedUsersQuery): Paginated<ManagedUser> => ({
  items: [],
  total: 0,
  page: query.page,
  limit: query.limit,
  totalPages: 1,
});

/** Solo se ordena por columnas de esta lista: el resto no llega hasta aquí. */
const SORT_COLUMN = {
  name: '"name"',
  email: '"email"',
  role: '"role"',
  createdAt: '"createdAt"',
} as const;

/**
 * Consultas sobre la tabla `user`, que gestiona Better Auth y por tanto no
 * tiene entidad de TypeORM. Se escribe el SQL a mano —igual que la semilla—
 * para que valga en SQLite y en Postgres.
 */
@Injectable()
export class UsersService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /** Cuántas cuentas hay. Es lo que decide si la instalación está sin estrenar. */
  async count(): Promise<number> {
    const rows = await this.dataSource.query<{ total: number | string }[]>(
      `SELECT COUNT(*) AS "total" FROM "user"`,
    );
    return Number(rows[0]?.total ?? 0);
  }

  async findById(id: string): Promise<ManagedUser | null> {
    const rows = await this.dataSource.query<UserRow[]>(
      `SELECT ${COLUMNS} FROM "user" WHERE "id" = ${p(1)}`,
      [id],
    );
    const row = rows[0];
    return row ? toManagedUser(row) : null;
  }

  /**
   * Listado con búsqueda, filtro por rol, orden y paginación en el servidor.
   *
   * `churchIds` es el **alcance**: las iglesias cuyas cuentas se pueden ver. Una
   * lista vacía no devuelve nada y `null` no acota —eso es el
   * superadministrador—. Es una cosa distinta del permiso: el permiso dice si se
   * entra al módulo, el alcance dice qué filas salen (RFC 0008 §6.2).
   */
  async findPage(
    query: ManagedUsersQuery,
    churchIds: string[] | null = null,
  ): Promise<Paginated<ManagedUser>> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (churchIds) {
      if (churchIds.length === 0) return empty(query);

      const marks = churchIds.map((id) => {
        params.push(id);
        return p(params.length);
      });
      conditions.push(
        `"id" IN (SELECT "user_id" FROM "church_members"
                  WHERE "church_id" IN (${marks.join(', ')}) AND "deleted_at" IS NULL)`,
      );
    }

    if (query.search) {
      // El patrón se pasa DOS veces, una por comparación. En Postgres se
      // podría repetir el mismo `$1`, pero en SQLite cada `?` es un parámetro
      // distinto y con uno solo la consulta falla.
      // Y va en minúsculas por los dos lados porque en Postgres LIKE distingue
      // mayúsculas.
      const pattern = `%${query.search.toLowerCase()}%`;
      params.push(pattern, pattern);
      conditions.push(
        `(LOWER("name") LIKE ${p(params.length - 1)} OR LOWER("email") LIKE ${p(params.length)})`,
      );
    }

    if (query.role) {
      params.push(query.role);
      conditions.push(`"role" = ${p(params.length)}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const totals = await this.dataSource.query<{ total: number | string }[]>(
      `SELECT COUNT(*) AS "total" FROM "user" ${where}`,
      params,
    );
    const total = Number(totals[0]?.total ?? 0);

    const order = query.order === 'asc' ? 'ASC' : 'DESC';
    const offset = (query.page - 1) * query.limit;
    const rows = await this.dataSource.query<UserRow[]>(
      `SELECT ${COLUMNS} FROM "user" ${where}
       ORDER BY ${SORT_COLUMN[query.sort]} ${order}
       LIMIT ${p(params.length + 1)} OFFSET ${p(params.length + 2)}`,
      [...params, query.limit, offset],
    );

    return {
      items: rows.map(toManagedUser),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
  }
}
