import type {
  ChurchDecision,
  CreateManagedUserInput,
  CreateRoleInput,
  ManagedUser,
  RoleRow,
  UpdateManagedUserInput,
  UpdateRoleInput,
} from '@navis/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

/**
 * Todo lo que cambia accesos: cuentas y roles.
 *
 * Cualquiera de estas mutaciones mueve los dos listados —cambiar el rol de una
 * cuenta altera el recuento del catálogo—, así que invalidan los dos. Está
 * escrito una sola vez en `useAccessMutation`.
 */
function useAccessMutation<TInput, TResult>(mutationFn: (input: TInput) => Promise<TResult>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles.all }),
      ]);
    },
  });
}

export function useCreateRole(api: ApiClient) {
  return useAccessMutation((input: CreateRoleInput) => api.post<RoleRow>('/roles', { ...input }));
}

export function useUpdateRole(api: ApiClient) {
  return useAccessMutation(({ id, ...input }: UpdateRoleInput & { id: string }) =>
    api.patch<RoleRow>(`/roles/${id}`, { ...input }),
  );
}

export function useDeleteRole(api: ApiClient) {
  return useAccessMutation(({ id }: { id: string }) => api.delete<void>(`/roles/${id}`));
}

export function useCreateUser(api: ApiClient) {
  return useAccessMutation((input: CreateManagedUserInput) =>
    api.post<ManagedUser>('/admin/users', { ...input }),
  );
}

export function useUpdateUser(api: ApiClient) {
  return useAccessMutation(({ id, ...input }: UpdateManagedUserInput & { id: string }) =>
    api.patch<ManagedUser>(`/admin/users/${id}`, { ...input }),
  );
}

export function useSetUserPassword(api: ApiClient) {
  return useAccessMutation(({ id, password }: { id: string; password: string }) =>
    api.patch<void>(`/admin/users/${id}/password`, { password }),
  );
}

/**
 * Aparte de `useAccessMutation`: cuando la cuenta era dueña de una iglesia y
 * se trasladó (RFC 0015), la baja mueve creyentes, listas y calendario a la
 * vez, no solo cuentas y roles. Sin clave invalida todo, como ya hace
 * `useSetActiveChurch` por el mismo motivo.
 */
export function useDeleteUser(api: ApiClient) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, churchDecisions }: { id: string; churchDecisions?: ChurchDecision[] }) =>
      api.delete<void>(`/admin/users/${id}`, churchDecisions ? { churchDecisions } : undefined),
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
