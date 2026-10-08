import { UsersError } from '@/data/users/users-gateway';

export type UserErrorKey =
    | 'auth.emailTaken'
    | 'roles.roleCeilingError'
    | 'roles.lastAdmin'
    | 'roles.ownRole'
    | 'roles.transferUnavailable'
    | 'errors.generic';

/** El mensaje que le toca a cada fallo del puerto; lo que no se reconoce cae en el genérico. */
export function userErrorKey(error: unknown): UserErrorKey {
    if (!(error instanceof UsersError)) return 'errors.generic';
    switch (error.code) {
        case 'email-taken':
            return 'auth.emailTaken';
        case 'role-ceiling':
            return 'roles.roleCeilingError';
        case 'last-admin':
            return 'roles.lastAdmin';
        case 'forbidden-self':
            return 'roles.ownRole';
        case 'transfer-unsupported':
            return 'roles.transferUnavailable';
        default:
            return 'errors.generic';
    }
}
