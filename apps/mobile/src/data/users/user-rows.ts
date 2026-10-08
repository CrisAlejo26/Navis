import type { ManagedUser } from '@navis/shared';

export interface UserDbRow {
    id: string;
    name: string;
    email: string;
    role: string;
    created_at: string;
}

export const USER_COLUMNS = 'u.id, u.name, u.email, u.role, u.created_at';

/** En local no hay correo que verificar: la cuenta nace usable en el aparato. */
export function toManagedUser(row: UserDbRow): ManagedUser {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        emailVerified: true,
        createdAt: new Date(row.created_at),
    };
}
