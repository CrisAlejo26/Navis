import { localUsersGateway } from './local-users-gateway';
import type { UsersGateway } from './users-gateway';

/**
 * El único sitio que decide qué adaptador usa la gestión de usuarios. Hoy es
 * SQLite; cuando el móvil se conecte a la API (RFC 0024) se cambia aquí por un
 * adaptador sobre `@navis/api-client` y ninguna pantalla se entera.
 */
export const usersGateway: UsersGateway = localUsersGateway;
