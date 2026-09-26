import type { JournalEntryListItem } from '@navis/shared';
import { Download, NotebookPen } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DataTable } from '@/components/data-table/data-table';
import { DeleteEntryDialog } from '@/components/journal/delete-entry-dialog';
import { EntryForm } from '@/components/journal/entry-form';
import { EntryCard, type EntryCells } from '@/components/journal/entry-card';
import { JournalCalendar } from '@/components/journal/journal-calendar';
import { JournalCardGrid } from '@/components/journal/journal-card-grid';
import { JournalViewSwitch } from '@/components/journal/journal-view-switch';
import { Oleaje } from '@/components/journal/oleaje';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
import { defineBulkAction } from '@/lib/data-table/bulk-actions';
import { accentVars } from '@/lib/accents';
import { ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import { useBatchMarkdownExport } from '@/lib/journal/use-batch-export';
import { useJournalScreen } from '@/lib/journal/use-journal-screen';
import { useJournalViewStore } from '@/lib/journal/view';

/**
 * El listado del cuaderno, con sus tres formas de verlo (RFC 0017 §7.4).
 *
 * Las tres vistas comparten la misma tabla de datos —barra, filtros, chips y
 * paginación—: la tabla y las fichas por defecto, y la rejilla de fichas y el
 * calendario entran por el `body` de `DataTable`. La única acción en lote es
 * exportar a Markdown (D12); nunca un borrado masivo.
 */
export function JournalListPage() {
    const { t } = useTranslation();
    const view = useJournalViewStore((state) => state.view);

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState<JournalEntryListItem | null>(null);
    const [deleting, setDeleting] = useState<JournalEntryListItem | null>(null);
    const batchExport = useBatchMarkdownExport();

    const screen = useJournalScreen({ onEdit: setEditing, onDelete: setDeleting });
    const searching = screen.state.request.filters.length > 0 || screen.state.request.search !== '';

    // La selección **manda** sobre los filtros (D1): se piden los identificadores
    // marcados y nada más. Es una acción de la tabla, declarada aquí (defineBulkAction).
    const exportMarkdown = defineBulkAction<JournalEntryListItem>({
        id: 'markdown',
        label: t('journal.bulkExport'),
        description: t('journal.bulkExportHelp'),
        icon: Download,
        tone: 'success',
        run: (entries) => batchExport.exportSelection(entries.map((entry) => entry.id)),
    });

    /** Lo mismo alimenta la fila de la tabla y la ficha (§7.5). */
    const cells = (entry: JournalEntryListItem, index: number): EntryCells => ({
        entry,
        index,
        onEdit: () => {
            setEditing(entry);
        },
        onDelete: () => {
            setDeleting(entry);
        },
    });

    return (
        <section className="gap-4 flex flex-col">
            <BackLink to="/journal" label={t('journal.title')} />

            <div className="gap-3 sm:flex-row sm:items-center sm:justify-between flex flex-col">
                <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('journal.title')}</h1>

                <Button
                    size="lg"
                    onClick={() => {
                        setCreating(true);
                    }}
                >
                    {t('journal.add')}
                </Button>
            </div>

            <Oleaje />

            {/* Cambiar de vista es un fundido, sin desplazamiento: no se está yendo a
          otro sitio. La clave hace que React remonte y la animación vuelva a
          lanzarse (mismo criterio que profecías §7.8). */}
            <div key={view} className="animate-page-in">
                <DataTable
                    columns={screen.columns}
                    state={screen.state}
                    source={screen.source}
                    getKey={(entry) => entry.id}
                    emptyIcon={NotebookPen}
                    emptyTitle={searching ? t('journal.noResults') : t('journal.emptyTitle')}
                    searchLabel={t('journal.search')}
                    bulkActions={[exportMarkdown]}
                    rowLabel={(entry) => t('journal.selectOne', { title: entry.title })}
                    // El mismo filete que ya lleva `EntryCard` en la ficha de móvil (D15):
                    // el color del tipo, también en el borde de la fila de escritorio.
                    rowClassName={() => 'animate-rise-in border-l-[var(--acento)]'}
                    rowStyle={(entry, index) => ({
                        ...accentVars(ENTRY_KIND_STYLES[entry.kind].accent),
                        animationDelay: `${String(Math.min(index, 12) * 35)}ms`,
                    })}
                    renderCard={(entry, index) => <EntryCard {...cells(entry, index)} />}
                    toolbarExtra={<JournalViewSwitch />}
                    body={
                        view === 'table'
                            ? undefined
                            : (items, selection) => {
                                  // Sin filas la tabla ya dice por qué.
                                  if (items.length === 0) return null;
                                  if (view === 'calendar') {
                                      return <JournalCalendar items={[...items]} />;
                                  }
                                  return (
                                      <JournalCardGrid
                                          items={items}
                                          cells={(entry, index) => ({
                                              ...cells(entry, index),
                                              // En la rejilla la casilla es de la propia ficha.
                                              selected: selection?.has(entry.id) ?? false,
                                              onToggleSelect: () => {
                                                  selection?.toggle(entry);
                                              },
                                          })}
                                      />
                                  );
                              }
                    }
                />
            </div>

            {/* Al editar viaja el identificador y el formulario carga la entrada
          entera: la fila solo trae un extracto de la anotación. */}
            {(creating || editing) && (
                <EntryForm
                    open
                    entryId={editing?.id}
                    onClose={() => {
                        setCreating(false);
                        setEditing(null);
                    }}
                />
            )}

            <DeleteEntryDialog
                entry={deleting}
                onClose={() => {
                    setDeleting(null);
                }}
            />
        </section>
    );
}
