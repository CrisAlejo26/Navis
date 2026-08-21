import { useDeleteTableView } from '@navis/api-client';
import type { CustomTableWithColumns } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ColumnsDialog } from '@/components/tables/columns-dialog';
import { DeleteTableDialog } from '@/components/tables/delete-table-dialog';
import { TableExportSheet } from '@/components/tables/table-export-sheet';
import { TableForm } from '@/components/tables/table-form';
import { ViewForm } from '@/components/tables/view-form';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { api } from '@/lib/api';
import { GRID_VIEW } from '@/lib/tables/use-active-view';
import { toast } from '@/lib/toast';

/** Qué diálogo de la ficha de una tabla está abierto, y con qué dato (RFC 0021). */
export interface TableDialogsState {
  editando: boolean;
  setEditando: (value: boolean) => void;
  gestionandoColumnas: boolean;
  setGestionandoColumnas: (value: boolean) => void;
  exportando: boolean;
  setExportando: (value: boolean) => void;
  creandoVista: boolean;
  setCreandoVista: (value: boolean) => void;
  borrandoVista: string | null;
  setBorrandoVista: (value: string | null) => void;
  borrando: boolean;
  setBorrando: (value: boolean) => void;
}

/**
 * Los diálogos de la ficha de una tabla, agrupados aparte para que
 * `routes/table.tsx` se quede en el tamaño de la Regla 6: editar, columnas,
 * nueva vista, exportar, borrar vista y borrar tabla.
 */
export function TableDialogs({
  table,
  tableId,
  dialogs,
  setActiveId,
}: {
  table: CustomTableWithColumns;
  tableId: string;
  dialogs: TableDialogsState;
  setActiveId: (id: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deleteView = useDeleteTableView(api);
  const {
    editando,
    setEditando,
    gestionandoColumnas,
    setGestionandoColumnas,
    exportando,
    setExportando,
    creandoVista,
    setCreandoVista,
    borrandoVista,
    setBorrandoVista,
    borrando,
    setBorrando,
  } = dialogs;

  return (
    <>
      <TableForm open={editando} onClose={() => setEditando(false)} table={table} />

      <ColumnsDialog
        open={gestionandoColumnas}
        onClose={() => setGestionandoColumnas(false)}
        tableId={tableId}
        columns={table.columns}
      />

      {/* Montado solo al abrirse: sus valores por defecto (tipo, columna) se
          calculan una vez, al montar, a partir de `columns` — si se quedara
          montado con el diálogo cerrado, una columna añadida después no
          llegaría a esos valores por defecto. */}
      {creandoVista && (
        <ViewForm
          open={creandoVista}
          onClose={() => setCreandoVista(false)}
          tableId={tableId}
          columns={table.columns}
        />
      )}

      <TableExportSheet
        open={exportando}
        onClose={() => setExportando(false)}
        table={table}
        columns={table.columns}
      />

      <ConfirmDialog
        open={borrandoVista !== null}
        onClose={() => setBorrandoVista(null)}
        onConfirm={() => {
          if (!borrandoVista) return;
          deleteView.mutate(
            { tableId, id: borrandoVista },
            {
              onSuccess: () => {
                toast.success(t('tables.viewDeleted'));
                setActiveId(GRID_VIEW);
                setBorrandoVista(null);
              },
            },
          );
        }}
        title={t('tables.deleteView')}
        description={t('tables.deleteViewExplain')}
        confirmLabel={t('common.delete')}
        destructive
        isPending={deleteView.isPending}
      />

      <DeleteTableDialog
        table={borrando ? table : null}
        onClose={() => setBorrando(false)}
        onDeleted={() => {
          void navigate('/tables');
        }}
      />
    </>
  );
}
