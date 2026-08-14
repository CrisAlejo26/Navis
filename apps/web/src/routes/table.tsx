import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TableDialogs } from '@/components/tables/table-dialogs';
import { TableHeader } from '@/components/tables/table-header';
import { TableViewContent } from '@/components/tables/table-view-content';
import { ViewsTabs } from '@/components/tables/views-tabs';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { usePermissions } from '@/lib/permissions';
import { useActiveView } from '@/lib/tables/use-active-view';
import { useTableScreen, useTableViewTabs } from '@/lib/tables/use-table-screen';

/**
 * La ficha de una tabla personalizada (RFC 0021, «Interfaz»).
 *
 * Cabecera a sangre en el color de la tabla, igual que una lista (D32), y
 * debajo la vista elegida: cuadrícula, que es la única que existe siempre
 * (D24), o una de las guardadas. Los diálogos viven en `TableDialogs`.
 */
export function TablePage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { table, tableId, isLoading, notFound } = useTableScreen();
  const views = useTableViewTabs(tableId);
  const { activeId, active, setActiveId } = useActiveView(views);

  const [editando, setEditando] = useState(false);
  const [gestionandoColumnas, setGestionandoColumnas] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [creandoVista, setCreandoVista] = useState(false);
  const [borrandoVista, setBorrandoVista] = useState<string | null>(null);
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

      <ViewsTabs
        views={views}
        activeId={activeId}
        editable={editable}
        onChange={setActiveId}
        onAdd={() => {
          setCreandoVista(true);
        }}
        onDelete={(view) => {
          setBorrandoVista(view.id);
        }}
      />

      <TableViewContent
        tableId={tableId}
        accent={table.accent}
        activeId={activeId}
        active={active}
        columns={table.columns}
        editable={can('tables.edit')}
      />

      <TableDialogs
        table={table}
        tableId={tableId}
        setActiveId={setActiveId}
        dialogs={{
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
        }}
      />
    </section>
  );
}
