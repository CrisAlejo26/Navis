import type { ManagedUser, ManagedUsersQuery, Paginated } from '@navis/shared';

import type { LocalDb } from '../local-db';
import { USER_COLUMNS, toManagedUser, type UserDbRow } from './user-rows';
import type { AskerContext } from './user-rules';

/** Nunca texto de fuera dentro del `ORDER BY`: cada campo de la API tiene su columna. */
const SORT_SQL = {
    name: 'LOWER(u.name)',
    email: 'u.email',
    role: 'u.role',
    createdAt: 'u.created_at',
} as const;

function placeholders(values: readonly string[]): string {
    return values.map(() => '?').join(', ');
}

/**
 * El alcance de la API (`ChurchesService.scopeFor`): el superadmin lo ve todo y
 * los demás, solo las cuentas de sus iglesias. `churchIds` acota, nunca amplía.
 */
function scopeClause(ctx: AskerContext, churchIds: readonly string[]): [string, string[]] {
    const narrowed = churchIds.length > 0 ? ` AND m.church_id IN (${placeholders(churchIds)})` : '';
    const own = ctx.isSuperadmin
        ? ''
        : ` AND m.church_id IN (SELECT church_id FROM church_members
             WHERE user_id = ? AND deleted_at IS NULL)`;
    if (ctx.isSuperadmin && churchIds.length === 0) return ['1 = 1', []];
    return [
        `u.id IN (SELECT m.user_id FROM church_members m
            JOIN churches c ON c.id = m.church_id AND c.deleted_at IS NULL
            WHERE m.deleted_at IS NULL${narrowed}${own})`,
        [...churchIds, ...(ctx.isSuperadmin ? [] : [ctx.userId])],
    ];
}

export async function queryUsers(
    db: LocalDb,
    ctx: AskerContext,
    query: ManagedUsersQuery,
): Promise<Paginated<ManagedUser>> {
    const clauses: string[] = [];
    const params: string[] = [];

    const [scope, scopeParams] = scopeClause(ctx, query.churchIds ?? []);
    clauses.push(scope);
    params.push(...scopeParams);

    const term = query.search?.toLowerCase();
    if (term) {
        clauses.push('(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ?)');
        params.push(`%${term}%`, `%${term}%`);
    }
    const roles = [...new Set([...(query.role ? [query.role] : []), ...(query.roles ?? [])])];
    if (roles.length > 0) {
        clauses.push(`u.role IN (${placeholders(roles)})`);
        params.push(...roles);
    }

    const where = clauses.join(' AND ');
    const total =
        (
            await db.getFirstAsync<{ n: number }>(
                `SELECT COUNT(*) AS n FROM local_user u WHERE ${where}`,
                ...params,
            )
        )?.n ?? 0;
    const direction = query.order === 'asc' ? 'ASC' : 'DESC';
    const rows = await db.getAllAsync<UserDbRow>(
        `SELECT ${USER_COLUMNS} FROM local_user u WHERE ${where}
         ORDER BY ${SORT_SQL[query.sort]} ${direction}, u.id LIMIT ? OFFSET ?`,
        ...params,
        query.limit,
        (query.page - 1) * query.limit,
    );
    return {
        items: rows.map(toManagedUser),
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
    };
}
