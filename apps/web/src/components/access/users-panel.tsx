import { listManagedUsers, useManagedUsers } from '@navis/api-client';
import type { ManagedUser, TableSort } from '@navis/shared';
import { UserPlus, UserSearch } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { UserCard } from '@/components/access/user-card';
import { UserDialogs } from '@/components/access/user-dialogs';
import { useUserColumns } from '@/components/access/use-user-columns';
import { DataTable } from '@/components/data-table/data-table';
import { Button } from '@/components/ui/button';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { serverSource } from '@/lib/data-table/source';
import type { TableExportConfig } from '@/lib/data-table/export-config';
import { useDataTableState } from '@/lib/data-table/use-data-table-state';
import { roleAccent, useRoleCatalog } from '@/lib/roles';
import { NO_DIALOG, type UserDialogsState } from '@/lib/user-dialogs-state';
import { toUsersQuery } from '@/lib/users/users-query';

const DEFAULT_SORTS: readonly TableSort[] = [{ columnId: 'createdAt', dir: 'desc' }];
/** La API solo ordena por una columna. */
const TABLE_OPTIONS = { singleSort: true };
/** Lo que trae «exportar todo»: 20 páginas de 100. Más allá, se avisa de que va cortado. */
const EXPORT_PAGES = 20;
const EXPORT_PAGE_SIZE = 100;

/** La pestaña de usuarios: tabla, filtros, alta y acciones sobre cada cuenta. */
export function UsersPanel() {
    const { t } = useTranslation();
    const { data: session } = useSession();
    const catalog = useRoleCatalog();
    const [dialog, setDialog] = useState<UserDialogsState>(NO_DIALOG);

    const onEdit = useCallback((user: ManagedUser) => {
        setDialog({ ...NO_DIALOG, editing: user });
    }, []);
    const onChangePassword = useCallback((user: ManagedUser) => {
        setDialog({ ...NO_DIALOG, changingPassword: user });
    }, []);
    const onDelete = useCallback((user: ManagedUser) => {
        setDialog({ ...NO_DIALOG, deleting: user });
    }, []);

    const selfId = session?.user.id;
    const columns = useUserColumns({ selfId, catalog, onEdit, onChangePassword, onDelete });
    const state = useDataTableState('users', columns, DEFAULT_SORTS, TABLE_OPTIONS);
    const query = useManagedUsers(api, toUsersQuery(state.request));

    // Exportar trae **todas** las cuentas que cumplen los filtros, página a página.
    const exportConfig = useMemo<TableExportConfig<ManagedUser>>(
        () => ({
            label: t('roles.exportUsersLabel'),
            fetchAll: async (request) => {
                const items: ManagedUser[] = [];
                let total = 0;
                for (let page = 1; page <= EXPORT_PAGES; page++) {
                    const result = await listManagedUsers(api, {
                        ...toUsersQuery(request),
                        page,
                        limit: EXPORT_PAGE_SIZE,
                    });
                    items.push(...result.items);
                    total = result.total;
                    if (page >= result.totalPages) break;
                }
                return { items, total, truncated: total > items.length };
            },
        }),
        [t],
    );

    return (
        <>
            <DataTable
                columns={columns}
                state={state}
                source={serverSource(query)}
                getKey={(user) => user.id}
                emptyIcon={UserSearch}
                emptyTitle={t('roles.noUsers')}
                searchLabel={t('roles.searchUsers')}
                selectable
                rowLabel={(user) => t('roles.selectUser', { name: user.name })}
                exportConfig={exportConfig}
                // El filete lleva el color del rol de esa cuenta (`roleAccent`): la
                // misma jerarquía que se ve en la pestaña de roles, así que el color
                // se reconoce igual en las dos pestañas de esta pantalla (Regla 9 §3).
                rowClassName={() => 'border-l-[var(--acento)]'}
                rowStyle={(user) => accentVars(roleAccent(catalog.get(user.role)?.level ?? 0))}
                renderCard={(user) => (
                    <UserCard
                        user={user}
                        isSelf={user.id === selfId}
                        catalog={catalog}
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
                )}
                toolbarExtra={
                    <Button
                        className="max-sm:h-11 shrink-0"
                        onClick={() => {
                            setDialog({ ...NO_DIALOG, creating: true });
                        }}
                    >
                        <UserPlus size={16} aria-hidden />
                        {t('roles.newUser')}
                    </Button>
                }
            />

            <UserDialogs
                state={dialog}
                onClose={() => {
                    setDialog(NO_DIALOG);
                }}
            />
        </>
    );
}
