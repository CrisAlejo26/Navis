import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import type { ChatContact } from '@navis/shared';
import { DataSource } from 'typeorm';

import { p } from '../database/sql-params';
import { RolesService } from '../roles/roles.service';

interface ContactRow {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

/**
 * Quién puede chatear con quién (RFC 0016 §2).
 *
 * El hallazgo que resuelve el diseño: `ROLE_PERMISSIONS.creyente` es un array
 * vacío, así que ese rol no tiene `communications.view` y queda fuera solo,
 * sin ningún caso especial — basta con seguir el mismo patrón de permisos que
 * ya usan calendario, creyentes y listas.
 *
 * Los roles elegibles se resuelven con `hasPermission` sobre lo que devuelve
 * `Role.permissions`, nunca comparando texto a mano contra la columna (Regla
 * 10: es JSON serializado a texto, y `simple-json` ya lo deja como array).
 */
@Injectable()
export class ChatParticipantsService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly roles: RolesService,
  ) {}

  /** Los slugs de rol que dan acceso a Comunicaciones, ahora mismo. */
  private eligibleRoleSlugs(): Promise<string[]> {
    return this.roles.rolesWithPermission('communications.view');
  }

  /**
   * Las cuentas de esta iglesia con las que se puede hablar: el buscador de
   * contactos para arrancar una conversación (§2). `excludeUserId` quita a
   * quien pregunta de su propia lista.
   */
  async contactsOf(
    churchId: string,
    excludeUserId: string,
    search?: string,
  ): Promise<ChatContact[]> {
    const roles = await this.eligibleRoleSlugs();
    if (roles.length === 0) return [];

    const params: unknown[] = [churchId, excludeUserId];
    const roleMarks = roles.map((role) => {
      params.push(role);
      return p(params.length);
    });

    let where = `"church_members"."church_id" = ${p(1)}
      AND "church_members"."deleted_at" IS NULL
      AND "user"."id" != ${p(2)}
      AND "user"."role" IN (${roleMarks.join(', ')})`;

    if (search) {
      // Dos veces el mismo patrón, uno por comparación: en SQLite cada `?` es
      // un parámetro distinto y reutilizar el marcador tumba la consulta.
      const pattern = `%${search.toLowerCase()}%`;
      params.push(pattern, pattern);
      where +=
        ` AND (LOWER("user"."name") LIKE ${p(params.length - 1)}` +
        ` OR LOWER("user"."email") LIKE ${p(params.length)})`;
    }

    const rows = await this.dataSource.query<ContactRow[]>(
      `SELECT DISTINCT "user"."id", "user"."name", "user"."email", "user"."image"
       FROM "user"
       INNER JOIN "church_members" ON "church_members"."user_id" = "user"."id"
       WHERE ${where}
       ORDER BY "user"."name" ASC`,
      params,
    );

    return rows.map((row) => ({ id: row.id, name: row.name, email: row.email, image: row.image }));
  }

  /**
   * Si **todas** esas cuentas son de esta iglesia y su rol da acceso a
   * Comunicaciones. Es lo que valida `channels.service.ts` antes de crear un
   * canal: no basta con que exista la cuenta, tiene que poder chatear.
   */
  async areEligible(churchId: string, userIds: readonly string[]): Promise<boolean> {
    const unique = [...new Set(userIds)];
    if (unique.length === 0) return false;

    const roles = await this.eligibleRoleSlugs();
    if (roles.length === 0) return false;

    const params: unknown[] = [churchId];
    const idMarks = unique.map((id) => {
      params.push(id);
      return p(params.length);
    });
    const roleMarks = roles.map((role) => {
      params.push(role);
      return p(params.length);
    });

    const rows = await this.dataSource.query<{ total: number | string }[]>(
      `SELECT COUNT(DISTINCT "user"."id") AS "total"
       FROM "user"
       INNER JOIN "church_members" ON "church_members"."user_id" = "user"."id"
       WHERE "church_members"."church_id" = ${p(1)}
         AND "church_members"."deleted_at" IS NULL
         AND "user"."id" IN (${idMarks.join(', ')})
         AND "user"."role" IN (${roleMarks.join(', ')})`,
      params,
    );

    return Number(rows[0]?.total ?? 0) === unique.length;
  }

  /**
   * El nombre, correo y avatar de esas cuentas, para firmar mensajes y pintar
   * miembros sin una consulta por fila. Sin filtro de iglesia ni de rol: una
   * vez que alguien ha escrito en un canal, su nombre se sigue mostrando
   * aunque después pierda el permiso o cambie de iglesia.
   */
  async usersById(ids: readonly string[]): Promise<Map<string, ChatContact>> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return new Map();

    const params: unknown[] = [];
    const marks = unique.map((id) => {
      params.push(id);
      return p(params.length);
    });

    const rows = await this.dataSource.query<ContactRow[]>(
      `SELECT "id", "name", "email", "image" FROM "user" WHERE "id" IN (${marks.join(', ')})`,
      params,
    );

    return new Map(rows.map((row) => [row.id, { ...row }]));
  }
}
