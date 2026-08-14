import { useDeleteTableRow, useTableRows } from '@navis/api-client';
import {
  DEFAULT_PAGE_SIZE,
  type CustomTableColumn,
  type CustomTableRow,
  type RowFilter,
} from '@navis/shared';
import { Table2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RowActions } from '@/components/tables/row-actions';
import { RowForm } from '@/components/tables/row-form';
import { RowsGridToolbar } from '@/components/tables/rows-grid-toolbar';
import { RowValueCell } from '@/components/tables/row-value-cell';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/ui/pagination';
import { TableCell, TableHeader } from '@/components/ui/table';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { encodeFilters } from '@/lib/tables/filters';
import { toast } from '@/lib/toast';

/**
 * La vista de cuadrícula (RFC 0021 D17–D19): la que siempre existe, paginada,
 * con búsqueda, orden y filtros calculados sobre las columnas activas.
 *
 * La fila de cabeceras lleva un tinte del acento de la tabla, y la columna por
 * la que se ordena se marca con el acento sólido — nunca blanco puro (D32).
 */
export function RowsGrid({
  tableId,
  accent,
  columns,
  editable,
}: {
  tableId: string;
  accent: string;
  columns: readonly CustomTableColumn[];
  editable: boolean;
}) {
  const { t } = useTranslation();
  const remove = useDeleteTableRow(api);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string | undefined>(undefined);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<RowFilter[]>([]);
  const [editando, setEditando] = useState<CustomTableRow | 'new' | null>(null);
  const [borrando, setBorrando] = useState<CustomTableRow | null>(null);

  const { data, isLoading, isError, refetch } = useTableRows(api, tableId, {
    page,
    limit,
    order,
    sort,
    search: search || undefined,
    filters: encodeFilters(filters),
  });

  const visibles = columns.filter((one) => one.isActive);
  const abrirFila = (row: CustomTableRow | 'new') => {
    setEditando(row);
  };
  const alternarOrden = (key: string) => {
    if (sort !== key) {
      setSort(key);
      setOrder('asc');
      return;
    }
    setOrder(order === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="gap-4 flex flex-col">
      <RowsGridToolbar
        columns={visibles}
        search={search}
        onSearch={(value) => {
          setSearch(value);
          setPage(1);
        }}
        sort={sort}
        order={order}
        onSort={(value, dir) => {
          setSort(value);
          setOrder(dir);
        }}
        filters={filters}
        onFilters={(value) => {
          setFilters(value);
          setPage(1);
        }}
        onAdd={
          editable
            ? () => {
                abrirFila('new');
              }
            : undefined
        }
      />

      <DataTable
        items={data?.items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        columnCount={visibles.length + (editable ? 1 : 0)}
        getKey={(row) => row.id}
        emptyIcon={Table2}
        emptyTitle={t('tables.emptyRows')}
        columns={
          <>
            {visibles.map((column) => (
              <TableHeader
                key={column.key}
                style={accentVars(accent)}
                sorted={column.key === sort ? order : false}
                onSort={() => {
                  alternarOrden(column.key);
                }}
                sortLabel={`${t('tables.sortBy')}: ${column.label}`}
                className={column.key === sort ? 'bg-[var(--acento)]/25' : 'bg-[var(--acento)]/10'}
              >
                {column.label}
              </TableHeader>
            ))}
            {editable && (
              <TableHeader style={accentVars(accent)} className="w-24 bg-[var(--acento)]/10" />
            )}
          </>
        }
        renderRow={(row) => (
          <>
            {visibles.map((column) => (
              <TableCell key={column.key}>
                <RowValueCell column={column} value={row.data[column.key]} />
              </TableCell>
            ))}
            {editable && (
              <TableCell>
                <RowActions
                  compact
                  onEdit={() => {
                    abrirFila(row);
                  }}
                  onDelete={() => {
                    setBorrando(row);
                  }}
                />
              </TableCell>
            )}
          </>
        )}
        renderCard={(row) => (
          <div className="gap-2 flex flex-col">
            {visibles.map((column) => (
              <p key={column.key} className="gap-1 text-sm flex items-baseline justify-between">
                <span className="text-muted-foreground">{column.label}</span>
                <RowValueCell column={column} value={row.data[column.key]} />
              </p>
            ))}
            {editable && (
              <RowActions
                compact={false}
                onEdit={() => {
                  abrirFila(row);
                }}
                onDelete={() => {
                  setBorrando(row);
                }}
              />
            )}
          </div>
        )}
        footer={
          data && (
            <Pagination
              page={page}
              limit={limit}
              total={data.total}
              totalPages={data.totalPages}
              onPageChange={setPage}
              onLimitChange={(value) => {
                setLimit(value);
                setPage(1);
              }}
            />
          )
        }
      />

      {editando && (
        <RowForm
          key={editando === 'new' ? 'new' : editando.id}
          open
          onClose={() => {
            setEditando(null);
          }}
          tableId={tableId}
          columns={visibles}
          row={editando === 'new' ? undefined : editando}
        />
      )}

      <ConfirmDialog
        open={borrando !== null}
        onClose={() => {
          setBorrando(null);
        }}
        onConfirm={() => {
          if (!borrando) return;
          remove.mutate(
            { tableId, id: borrando.id },
            {
              onSuccess: () => {
                toast.success(t('tables.rowDeleted'));
                setBorrando(null);
              },
            },
          );
        }}
        title={t('tables.deleteRow')}
        description={t('tables.deleteRowExplain')}
        confirmLabel={t('common.delete')}
        destructive
        isPending={remove.isPending}
      />
    </div>
  );
}
