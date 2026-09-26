import type { ManagedUser, RoleRow, RoleSlug } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/access/role-badge';
import { UserActions } from '@/components/access/user-actions';
import { Badge } from '@/components/ui/badge';
import { useChurches } from '@/lib/churches';
import type { DataTableColumn } from '@/lib/data-table/columns';
import { cellDay } from '@/lib/export/columns';
import { formatDate } from '@/lib/format';
import { roleAccent, useRoleHint, useRoleLabel } from '@/lib/roles';

interface Handlers {
    selfId: string | undefined;
    catalog: Map<RoleSlug, RoleRow>;
    onEdit: (user: ManagedUser) => void;
    onChangePassword: (user: ManagedUser) => void;
    onDelete: (user: ManagedUser) => void;
}

/** Un instante como el día de calendario **de quien mira** (no el UTC: en Bogotá saldría el siguiente). */
function localDay(date: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Las columnas de la tabla de cuentas. La API filtra por **rol** y por **iglesia**
 * y ordena por una sola columna, y así se declara: los dos filtros solo ofrecen
 * «es uno de» y la iglesia es una columna **solo de filtro** (no se pinta), que
 * únicamente existe si la persona tiene más de una a la que mirar.
 */
export function useUserColumns(handlers: Handlers): DataTableColumn<ManagedUser>[] {
    const { t } = useTranslation();
    const roleLabel = useRoleLabel();
    const roleHint = useRoleHint();
    const { items: churches } = useChurches();
    const { selfId, catalog, onEdit, onChangePassword, onDelete } = handlers;

    return useMemo(() => {
        const roleOptions = [...catalog.values()].map((role) => ({
            value: role.slug,
            label: roleLabel(role),
            hint: roleHint(role) || undefined,
            accent: roleAccent(role.level),
        }));
        const manyChurches = churches.length >= 2;

        return [
            {
                id: 'name',
                kind: 'text',
                label: t('roles.columnName'),
                hideable: false,
                value: (user) => user.name,
                cell: (user) => (
                    <span className="gap-2 flex items-center">
                        <span className="font-medium">{user.name}</span>
                        {user.id === selfId && <Badge variant="outline">{t('roles.you')}</Badge>}
                    </span>
                ),
            },
            {
                id: 'email',
                kind: 'text',
                label: t('roles.columnEmail'),
                className: 'text-muted-foreground',
                value: (user) => user.email,
                cell: (user) => (
                    <span className="gap-2 flex items-center">
                        {user.email}
                        {!user.emailVerified && (
                            <Badge variant="muted">{t('roles.unverified')}</Badge>
                        )}
                    </span>
                ),
            },
            {
                id: 'role',
                kind: 'select',
                label: t('roles.columnRole'),
                filterable: true,
                facet: true,
                operators: ['in'],
                description: t('roles.filterRoleHelp'),
                options: roleOptions,
                value: (user) => user.role,
                cell: (user) => <RoleBadge slug={user.role} role={catalog.get(user.role)} />,
            },
            {
                id: 'createdAt',
                kind: 'date',
                label: t('roles.columnCreated'),
                className: 'whitespace-nowrap text-muted-foreground tabular-nums',
                value: (user) => localDay(user.createdAt),
                // Un día de calendario de quien mira, y fecha de verdad en Excel.
                exportCell: (user) => cellDay(localDay(user.createdAt)),
                // `medium` y no `short`: «3/8/26» se lee distinto según el país y aquí
                // la fecha se mira de un vistazo, no se compara al milímetro.
                cell: (user) => formatDate(user.createdAt),
            },
            {
                id: 'church',
                kind: 'select',
                label: t('roles.columnChurch'),
                filterOnly: true,
                sortable: false,
                filterable: manyChurches,
                facet: manyChurches,
                operators: ['in'],
                description: t('roles.filterChurchHelp'),
                options: churches.map((church) => ({ value: church.id, label: church.name })),
                cell: () => null,
            },
            {
                id: 'actions',
                kind: 'text',
                label: t('common.actions'),
                header: <span className="sr-only">{t('common.actions')}</span>,
                sortable: false,
                hideable: false,
                cell: (user) => (
                    <UserActions
                        isSelf={user.id === selfId}
                        onEdit={() => {
                            onEdit(user);
                        }}
                        onChangePassword={() => {
                            onChangePassword(user);
                        }}
                        onDelete={() => {
                            onDelete(user);
                        }}
                    />
                ),
            },
        ] satisfies DataTableColumn<ManagedUser>[];
    }, [t, roleLabel, roleHint, churches, catalog, selfId, onEdit, onChangePassword, onDelete]);
}
