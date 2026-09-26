import { useRoles } from '@navis/api-client';
import type { RoleRow, TableSort } from '@navis/shared';
import { Plus, SearchX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteRoleDialog } from '@/components/access/delete-role-dialog';
import { RoleCard } from '@/components/access/role-card';
import { useRoleColumns } from '@/components/access/role-columns';
import { useRoleBulkActions } from '@/components/access/use-role-bulk-actions';
import { RoleDialog } from '@/components/access/role-dialog';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { useDataTableState } from '@/lib/data-table/use-data-table-state';
import { roleAccent, useRoleLabel } from '@/lib/roles';

/** Techo del catálogo que se trae de una vez. Los roles son pocos por naturaleza. */
const CATALOG_LIMIT = 100;
const DEFAULT_SORTS: readonly TableSort[] = [{ columnId: 'level', dir: 'asc' }];

/**
 * La pestaña de roles: qué roles hay, qué puede hacer cada uno, cuántas
 * cuentas lo tienen, y su alta, edición y baja.
 *
 * La tabla va en **modo cliente**: el catálogo se trae entero y se busca y
 * ordena sobre el nombre que la persona ve (el de los roles de serie se
 * traduce; el servidor no podría buscar «Administrador» en seis idiomas).
 */
export function RolesPanel() {
    const { t } = useTranslation();
    const { data, isFetching, isError, refetch } = useRoles(api, {
        page: 1,
        limit: CATALOG_LIMIT,
        sort: 'level',
        order: 'asc',
    });

    const [editing, setEditing] = useState<RoleRow | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState<RoleRow | null>(null);

    const roleLabel = useRoleLabel();
    const bulkActions = useRoleBulkActions();
    const columns = useRoleColumns({ onEdit: setEditing, onDelete: setDeleting });
    const state = useDataTableState('roles', columns, DEFAULT_SORTS);

    return (
        <>
            <DataTable
                columns={columns}
                state={state}
                source={{
                    kind: 'client',
                    items: data?.items,
                    isLoading: isFetching && !data,
                    isError,
                    onRetry: () => void refetch(),
                }}
                getKey={(role) => role.id}
                emptyIcon={SearchX}
                emptyTitle={t('roles.noRoles')}
                searchLabel={t('roles.searchRoles')}
                bulkActions={bulkActions}
                rowLabel={(role) => t('roles.selectRole', { name: roleLabel(role) })}
                exportConfig={{ label: t('roles.exportLabel') }}
                // El filete de cada fila lleva el color de su nivel (`roleAccent`): la
                // misma jerarquía que ya dibuja `RoleBadge` en puntos, ahora también
                // en el borde de la fila (Regla 9 §3).
                rowClassName={() => 'border-l-[var(--acento)]'}
                rowStyle={(role) => accentVars(roleAccent(role.level))}
                renderCard={(role) => (
                    <RoleCard
                        role={role}
                        onEdit={() => setEditing(role)}
                        onDelete={() => setDeleting(role)}
                    />
                )}
                toolbarExtra={
                    <Button
                        className="max-sm:h-11 shrink-0"
                        onClick={() => {
                            setCreating(true);
                        }}
                    >
                        <Plus size={16} aria-hidden />
                        {t('roles.newRole')}
                    </Button>
                }
            />

            <RoleDialog
                role={editing}
                open={creating || editing !== null}
                onClose={() => {
                    setCreating(false);
                    setEditing(null);
                }}
            />
            <DeleteRoleDialog
                role={deleting}
                onClose={() => {
                    setDeleting(null);
                }}
            />
        </>
    );
}
