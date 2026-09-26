import type { RoleRow } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoleActions } from '@/components/access/role-actions';
import { RoleBadge } from '@/components/access/role-badge';
import { Badge } from '@/components/ui/badge';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { formatNumber } from '@/lib/format';
import { useRoleHint, useRoleLabel } from '@/lib/roles';

interface Handlers {
    onEdit: (role: RoleRow) => void;
    onDelete: (role: RoleRow) => void;
}

/**
 * Las columnas de la tabla de roles, con lo mismo que pintaba la fila de antes.
 *
 * El nombre se ordena y se busca por **lo que la persona lee** (`label`), no por
 * el slug: el de los roles de serie se traduce y no está en la base de datos.
 * `onEdit` y `onDelete` tienen que ser estables (un `setState`): de ellos cuelga
 * el `useMemo` de las columnas.
 */
export function useRoleColumns({ onEdit, onDelete }: Handlers): DataTableColumn<RoleRow>[] {
    const { t } = useTranslation();
    const label = useRoleLabel();
    const hint = useRoleHint();

    return useMemo(
        () => [
            {
                id: 'name',
                kind: 'text',
                label: t('roles.columnRole'),
                hideable: false,
                filterable: true,
                description: t('roles.filterNameHelp'),
                value: (role) => label(role),
                cell: (role) => (
                    <span className="gap-1 flex flex-col">
                        <RoleBadge slug={role.slug} role={role} className="font-medium" />
                        {hint(role) && (
                            <span className="text-xs pl-[26px] text-muted-foreground">
                                {hint(role)}
                            </span>
                        )}
                    </span>
                ),
            },
            {
                id: 'level',
                kind: 'number',
                label: t('roles.columnLevel'),
                filterable: true,
                description: t('roles.filterLevelHelp'),
                className: 'text-muted-foreground tabular-nums',
                value: (role) => role.level,
                cell: (role) => role.level,
            },
            {
                id: 'usersCount',
                kind: 'number',
                label: t('roles.columnAccounts'),
                filterable: true,
                description: t('roles.filterAccountsHelp'),
                align: 'right',
                className: 'tabular-nums',
                value: (role) => role.usersCount,
                cell: (role) => formatNumber(role.usersCount),
            },
            {
                id: 'kind',
                kind: 'select',
                label: t('roles.columnKind'),
                align: 'right',
                sortable: false,
                filterable: true,
                facet: true,
                description: t('roles.filterKindHelp'),
                options: [
                    { value: 'system', label: t('roles.system'), hint: t('roles.systemHint') },
                    { value: 'custom', label: t('roles.custom'), hint: t('roles.customHint') },
                ],
                value: (role) => (role.isSystem ? 'system' : 'custom'),
                cell: (role) => (
                    <Badge variant={role.isSystem ? 'muted' : 'outline'}>
                        {role.isSystem ? t('roles.system') : t('roles.custom')}
                    </Badge>
                ),
            },
            {
                id: 'actions',
                kind: 'text',
                label: t('common.actions'),
                header: <span className="sr-only">{t('common.actions')}</span>,
                sortable: false,
                hideable: false,
                cell: (role) => (
                    <RoleActions
                        role={role}
                        onEdit={() => {
                            onEdit(role);
                        }}
                        onDelete={() => {
                            onDelete(role);
                        }}
                    />
                ),
            },
        ],
        // `label` y `hint` cambian con el idioma, que es justo cuando hay que repintar.
        [t, label, hint, onEdit, onDelete],
    );
}
