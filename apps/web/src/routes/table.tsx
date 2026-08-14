import { useDeleteTable } from '@navis/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ColumnsDialog } from '@/components/tables/columns-dialog';
import { RowsGrid } from '@/components/tables/rows-grid';
import { TableExportSheet } from '@/components/tables/table-export-sheet';
import { TableForm } from '@/components/tables/table-form';
import { TableHeader } from '@/components/tables/table-header';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';
import { useTableScreen } from '@/lib/tables/use-table-screen';
import { toast } from '@/lib/toast';

/**
 * La ficha de una tabla personalizada (RFC 0021, «Interfaz»).
 *
 * Cabecera a sangre en el color de la tabla, igual que una lista (D32), y
 * debajo la cuadrícula: es la única vista que existe siempre (D25).
 */
export function TablePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { table, tableId, isLoading, notFound } = useTableScreen();
  const deleteTable = useDeleteTable(api);

  const [editando, setEditando] = useState(false);
  const [gestionandoColumnas, setGestionandoColumnas] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  if (isLoading) return <PageSkeleton />;
  if (notFound || !table) {
    return <p className="text-sm text-muted-foreground">{t('tables.notFound')}</p>;
  }

  const editable = can('tables.manage');

  return (
    <section className="gap-6 animate-page-in flex flex-col">
      <TableHeader
        table={table}
        editable={editable}
        onEdit={() => {
          setEditando(true);
        }}
        onDelete={() => {
          setBorrando(true);
        }}
        onColumns={() => {
          setGestionandoColumnas(true);
        }}
        onExport={() => {
          setExportando(true);
        }}
      />

      <RowsGrid tableId={tableId} columns={table.columns} editable={can('tables.edit')} />

      <TableForm
        open={editando}
        onClose={() => {
          setEditando(false);
        }}
        table={table}
      />

      <ColumnsDialog
        open={gestionandoColumnas}
        onClose={() => {
          setGestionandoColumnas(false);
        }}
        tableId={tableId}
        columns={table.columns}
      />

      <TableExportSheet
        open={exportando}
        onClose={() => {
          setExportando(false);
        }}
        table={table}
        columns={table.columns}
      />

      <ConfirmDialog
        open={borrando}
        onClose={() => {
          setBorrando(false);
        }}
        onConfirm={() => {
          deleteTable.mutate(table.id, {
            onSuccess: () => {
              toast.success(t('tables.deleted', { name: table.name }));
              void navigate('/tables');
            },
          });
        }}
        title={t('tables.delete')}
        description={t('tables.deleteExplain')}
        confirmLabel={t('common.delete')}
        destructive
        isPending={deleteTable.isPending}
      />
    </section>
  );
}
