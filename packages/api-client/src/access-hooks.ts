import type {
  ManagedUser,
  ManagedUsersQuery,
  MyRole,
  Paginated,
  RegisterInput,
  RoleRow,
  RolesQuery,
  SetupStatus,
} from '@navis/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Consultas de accesos: estado del primer arranque, catálogo de roles y
 * listado de usuarios. Lo que cambia datos está en `access-mutations`.
 *
 * Igual que el resto de hooks compartidos, reciben el cliente por parámetro
 * para que web y móvil decidan cómo construirlo.
 */

/**
 * Convierte los filtros en query string, dejando fuera los campos vacíos.
 *
 * Los campos se enumeran a mano y no con `Object.entries`: esa devuelve
 * `[string, any][]` para un objeto sin índice, y por ahí entraría un `any`
 * (Regla 10). De paso queda escrito qué viaja exactamente en la URL.
 */
function toSearchParams(query: ManagedUsersQuery | RolesQuery): string {
  const entries: [string, string | number | undefined][] = [
    ['page', query.page],
    ['limit', query.limit],
    ['search', query.search],
    ['sort', query.sort],
    ['order', query.order],
    ['role', 'role' in query ? query.role : undefined],
    // Las iglesias viajan separadas por comas: una sola clave por filtro deja
    // la URL legible y la caché de TanStack Query con una entrada por combinación.
    ['churchIds', 'churchIds' in query ? query.churchIds?.join(',') : undefined],
  ];

  const params = new URLSearchParams();
  for (const [key, value] of entries) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}

/**
 * ¿Esta instalación está sin estrenar? Lo consulta la web antes de enseñar el
 * login: si no hay ninguna cuenta, lleva directamente a crear la de
 * administrador. Sin reintentos y sin caducar: la respuesta solo cambia una
 * vez en la vida de la instalación, y la invalida quien crea la cuenta.
 */
export function useSetupStatus(api: ApiClient): UseQueryResult<SetupStatus> {
  return useQuery({
    queryKey: queryKeys.setup.status,
    queryFn: () => api.get<SetupStatus>('/setup/status'),
    retry: false,
    staleTime: Infinity,
  });
}

export function useCreateFirstAdmin(api: ApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RegisterInput) => api.post<ManagedUser>('/setup/admin', { ...input }),
    onSuccess: () => {
      queryClient.setQueryData<SetupStatus>(queryKeys.setup.status, { needsSetup: false });
    },
  });
}

/**
 * Catálogo de roles con el número de cuentas de cada uno.
 *
 * `keepPreviousData` es lo que hace que la tabla no parpadee al cambiar de
 * página, de orden o de búsqueda: se sigue viendo lo anterior hasta que llega
 * lo nuevo, en vez de un hueco vacío.
 */
export function useRoles(
  api: ApiClient,
  query: RolesQuery,
  enabled = true,
): UseQueryResult<Paginated<RoleRow>> {
  return useQuery({
    queryKey: queryKeys.roles.list(query),
    queryFn: () => api.get<Paginated<RoleRow>>(`/roles?${toSearchParams(query)}`),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

/**
 * El rol de quien ha entrado, con sus permisos. Es lo que decide qué entradas
 * del menú se pintan y a qué pantallas se puede entrar.
 *
 * Va aparte del catálogo completo a propósito: esto lo pide **todo el mundo**
 * en cada arranque, y el catálogo solo quien administra accesos. Se cachea unos
 * minutos porque los permisos de un rol se cambian de tarde en tarde.
 */
export function useMyRole(api: ApiClient, enabled = true): UseQueryResult<MyRole> {
  return useQuery({
    queryKey: queryKeys.roles.mine,
    queryFn: () => api.get<MyRole>('/roles/mine'),
    enabled,
    staleTime: 5 * 60_000,
  });
}

/** Cuentas con su rol. Solo responde a quien puede ver usuarios. */
export function useManagedUsers(
  api: ApiClient,
  query: ManagedUsersQuery,
  enabled = true,
): UseQueryResult<Paginated<ManagedUser>> {
  return useQuery({
    queryKey: queryKeys.users.list(query),
    queryFn: () => api.get<Paginated<ManagedUser>>(`/admin/users?${toSearchParams(query)}`),
    enabled,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
