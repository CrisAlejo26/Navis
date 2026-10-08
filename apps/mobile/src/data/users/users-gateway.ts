import type {
    ChurchDecision,
    CreateManagedUserInput,
    CreateRoleInput,
    ManagedUser,
    ManagedUsersQuery,
    MyRole,
    OwnedChurchImpact,
    Paginated,
    RoleRow,
    RolesQuery,
    UpdateManagedUserInput,
    UpdateRoleInput,
} from '@navis/shared';

/**
 * El puerto de la gestión de usuarios. Las pantallas y los hooks solo hablan
 * con esto, y con los tipos de `@navis/shared` que ya usa la web: hoy lo cumple
 * SQLite (`local-users-gateway.ts`) y el día que el móvil se conecte a la API
 * bastará otro adaptador sobre `useManagedUsers`, `useRoles`… de
 * `@navis/api-client`, sin tocar ninguna pantalla.
 *
 * Quien pregunta (`asker`) va siempre explícito: el alcance por iglesia y el
 * tope de rol dependen de él, y así el adaptador remoto lo ignora sin cambiar
 * la firma.
 */
export interface Asker {
    userId: string;
    churchId: string;
}

export type UsersErrorCode =
    | 'not-found'
    | 'forbidden-self'
    | 'forbidden-scope'
    | 'forbidden-permission'
    | 'role-ceiling'
    | 'invalid-role'
    | 'email-taken'
    | 'last-admin'
    | 'owns-churches'
    | 'decision-required'
    | 'transfer-unsupported'
    | 'role-locked'
    | 'role-in-use'
    | 'name-taken';

/** El equivalente local de un `HttpException`; `data` viaja como en el 409 de la API. */
export class UsersError extends Error {
    constructor(
        readonly code: UsersErrorCode,
        readonly data?: { ownedChurches: OwnedChurchImpact[] },
    ) {
        super(code);
        this.name = 'UsersError';
    }
}

export interface UsersGateway {
    listUsers(asker: Asker, query: ManagedUsersQuery): Promise<Paginated<ManagedUser>>;
    /**
     * Una cuenta por id, para la ficha. La API de hoy no tiene `GET /admin/users/:id`: el
     * adaptador remoto lo añadirá o la sacará del listado.
     */
    getUser(asker: Asker, id: string): Promise<ManagedUser>;
    createUser(asker: Asker, input: CreateManagedUserInput): Promise<ManagedUser>;
    updateUser(asker: Asker, id: string, input: UpdateManagedUserInput): Promise<ManagedUser>;
    setPassword(asker: Asker, id: string, password: string): Promise<void>;
    removeUser(asker: Asker, id: string, decisions?: ChurchDecision[]): Promise<void>;
    listRoles(asker: Asker, query: RolesQuery): Promise<Paginated<RoleRow>>;
    createRole(asker: Asker, input: CreateRoleInput): Promise<RoleRow>;
    updateRole(asker: Asker, id: string, input: UpdateRoleInput): Promise<RoleRow>;
    removeRole(asker: Asker, id: string): Promise<void>;
    myRole(asker: Asker): Promise<MyRole>;
}
