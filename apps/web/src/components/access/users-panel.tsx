import { useManagedUsers } from '@navis/api-client';
import { USER_SORT_FIELDS, type RoleSlug } from '@navis/shared';
import { UserSearch } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { UserDialogs } from '@/components/access/user-dialogs';
import { UserRow } from '@/components/access/user-row';
import { UsersToolbar } from '@/components/access/users-toolbar';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SortableColumns } from '@/components/ui/sortable-columns';
import { TableHeader } from '@/components/ui/table';
import { api } from '@/lib/api';
import { useSession } from '@/lib/auth-client';
import { useRoleCatalog } from '@/lib/roles';
import { useTableQuery } from '@/lib/use-table-query';
import { NO_DIALOG, type UserDialogsState } from '@/lib/user-dialogs-state';

/** La pestaña de usuarios: tabla, filtros, alta y acciones sobre cada cuenta. */
export function UsersPanel() {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [params, setParams] = useSearchParams();

  const query = useTableQuery({ fields: USER_SORT_FIELDS, sort: 'createdAt', order: 'desc' });
  const catalog = useRoleCatalog();
  const role = params.get('role') ?? undefined;

  const { data, isFetching, isError, refetch } = useManagedUsers(api, {
    page: query.page,
    limit: query.limit,
    search: query.search || undefined,
    role,
    sort: query.sort,
    order: query.order,
  });

  const [dialog, setDialog] = useState<UserDialogsState>(NO_DIALOG);

  const setRole = (next: RoleSlug | undefined) => {
    setParams(
      (previous) => {
        const search = new URLSearchParams(previous);
        if (next) search.set('role', next);
        else search.delete('role');
        search.delete('page');
        return search;
      },
      { replace: true },
    );
  };

  const columns = [
    { field: 'name', label: t('roles.columnName') },
    { field: 'email', label: t('roles.columnEmail') },
    { field: 'role', label: t('roles.columnRole') },
    { field: 'createdAt', label: t('roles.columnCreated') },
  ] as const;

  return (
    <>
      <DataTable
        items={data?.items}
        isLoading={isFetching && !data}
        isError={isError}
        onRetry={() => void refetch()}
        columnCount={columns.length + 1}
        getKey={(user) => user.id}
        emptyIcon={UserSearch}
        emptyTitle={t('roles.noUsers')}
        toolbar={
          <UsersToolbar
            search={query.search}
            onSearchChange={query.setSearch}
            role={role}
            onRoleChange={setRole}
            onCreate={() => {
              setDialog({ ...NO_DIALOG, creating: true });
            }}
          />
        }
        columns={
          <>
            <SortableColumns
              columns={columns}
              sort={query.sort}
              order={query.order}
              onToggle={query.toggleSort}
            />
            <TableHeader className="text-right">
              <span className="sr-only">{t('common.actions')}</span>
            </TableHeader>
          </>
        }
        renderRow={(user) => (
          <UserRow
            user={user}
            isSelf={user.id === session?.user.id}
            catalog={catalog}
            onEdit={() => {
              setDialog({ ...NO_DIALOG, editing: user });
            }}
            onChangePassword={() => {
              setDialog({ ...NO_DIALOG, changingPassword: user });
            }}
            onDelete={() => {
              setDialog({ ...NO_DIALOG, deleting: user });
            }}
          />
        )}
        footer={
          data && (
            <Pagination
              page={data.page}
              limit={data.limit}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={query.setPage}
              onLimitChange={query.setLimit}
            />
          )
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
