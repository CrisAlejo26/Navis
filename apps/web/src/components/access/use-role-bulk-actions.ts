import { useDeleteRole } from '@navis/api-client';
import type { RoleRow } from '@navis/shared';
import { Trash2 } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { api } from '@/lib/api';
import { defineBulkAction, type BulkAction } from '@/lib/data-table/bulk-actions';
import { toast } from '@/lib/toast';

/**
 * Las acciones masivas de la tabla de roles. **Así se añade una a cualquier
 * tabla**: se declara aquí, se pasa en `bulkActions` y no se toca `DataTable`.
 *
 * «Eliminar» se bloquea —con el porqué en el tooltip— si entre las marcadas hay
 * algún rol de serie o alguno que tiene cuentas: son los mismos casos en los que
 * el botón de una sola fila ya está deshabilitado.
 */
export function useRoleBulkActions(): BulkAction<RoleRow>[] {
    const { t } = useTranslation();
    const deleteRole = useDeleteRole(api);

    return useMemo(
        () => [
            defineBulkAction<RoleRow>({
                id: 'delete',
                label: t('roles.bulkDelete'),
                description: t('roles.bulkDeleteHelp'),
                icon: Trash2,
                tone: 'destructive',
                blockedReason: (roles) =>
                    roles.some((role) => role.isSystem || role.usersCount > 0)
                        ? t('roles.bulkDeleteBlocked')
                        : undefined,
                confirm: (roles) => ({
                    title: t('roles.bulkDeleteTitle', { count: roles.length }),
                    description: t('roles.bulkDeleteBody'),
                    confirmLabel: t('roles.bulkDelete'),
                    destructive: true,
                }),
                run: async (roles) => {
                    // Una a una: si una falla, se para y las anteriores ya están borradas.
                    for (const role of roles) await deleteRole.mutateAsync({ id: role.id });
                    toast.success(t('roles.bulkDeleted', { count: roles.length }));
                },
            }),
        ],
        [t, deleteRole],
    );
}
