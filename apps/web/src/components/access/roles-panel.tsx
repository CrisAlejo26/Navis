import { useRoles } from '@navis/api-client';
import { ROLE_SORT_FIELDS, type RoleRow } from '@navis/shared';
import { SearchX } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteRoleDialog } from '@/components/access/delete-role-dialog';
import { RoleCard } from '@/components/access/role-card';
import { RoleDialog } from '@/components/access/role-dialog';
import { RoleRow as RoleCells } from '@/components/access/role-row';
import { RolesToolbar } from '@/components/access/roles-toolbar';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { SortableColumns } from '@/components/ui/sortable-columns';
import { TableHeader } from '@/components/ui/table';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { roleAccent } from '@/lib/roles';
import { useRoleRows } from '@/lib/use-role-rows';
import { useTableQuery } from '@/lib/use-table-query';

/** Techo del catálogo que se trae de una vez. Los roles son pocos por naturaleza. */
const CATALOG_LIMIT = 100;

/**
 * La pestaña de roles: qué roles hay, qué puede hacer cada uno, cuántas
 * cuentas lo tienen, y su alta, edición y baja.
 */
export function RolesPanel() {
  const { t } = useTranslation();
  const query = useTableQuery({ fields: ROLE_SORT_FIELDS, sort: 'level', order: 'asc' });

  const { data, isFetching, isError, refetch } = useRoles(api, {
    page: 1,
    limit: CATALOG_LIMIT,
    sort: 'level',
    order: 'asc',
  });

  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<RoleRow | null>(null);

  const rows = useRoleRows({
    roles: data?.items,
    search: query.search,
    sort: query.sort,
    order: query.order,
  });

  const totalPages = Math.max(1, Math.ceil(rows.length / query.limit));
  const page = Math.min(query.page, totalPages);
  const visible = rows.slice((page - 1) * query.limit, page * query.limit);

  /** Lo mismo alimenta la fila de la tabla y la ficha de móvil. */
  const cells = (role: RoleRow) => ({
    role,
    onEdit: () => {
      setEditing(role);
    },
    onDelete: () => {
      setDeleting(role);
    },
  });

  const columns = [
    { field: 'slug', label: t('roles.columnRole') },
    { field: 'level', label: t('roles.columnLevel') },
    { field: 'usersCount', label: t('roles.columnAccounts'), align: 'right' },
  ] as const;

  return (
    <>
      <DataTable
        items={visible}
        isLoading={isFetching && !data}
        isError={isError}
        onRetry={() => void refetch()}
        columnCount={columns.length + 2}
        getKey={(role) => role.id}
        emptyIcon={SearchX}
        emptyTitle={t('roles.noRoles')}
        // El filete de cada fila lleva el color de su nivel (`roleAccent`): la
        // misma jerarquía que ya dibuja `RoleBadge` en puntos, ahora también
        // en el borde de la fila (Regla 9 §3).
        rowClassName={() => 'border-l-[var(--acento)]'}
        rowStyle={(role) => accentVars(roleAccent(role.level))}
        toolbar={
          <RolesToolbar
            search={query.search}
            onSearchChange={query.setSearch}
            onCreate={() => {
              setCreating(true);
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
            <TableHeader className="text-right">{t('roles.columnKind')}</TableHeader>
            <TableHeader className="text-right">
              <span className="sr-only">{t('common.actions')}</span>
            </TableHeader>
          </>
        }
        renderRow={(role) => <RoleCells {...cells(role)} />}
        renderCard={(role) => <RoleCard {...cells(role)} />}
        footer={
          <Pagination
            page={page}
            limit={query.limit}
            total={rows.length}
            totalPages={totalPages}
            onPageChange={query.setPage}
            onLimitChange={query.setLimit}
          />
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
