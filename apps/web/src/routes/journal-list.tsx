import type { JournalEntryListItem } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteEntryDialog } from '@/components/journal/delete-entry-dialog';
import { EntryForm } from '@/components/journal/entry-form';
import type { EntryCells } from '@/components/journal/entry-row';
import { JournalCalendar } from '@/components/journal/journal-calendar';
import { JournalCards } from '@/components/journal/journal-cards';
import { JournalTable } from '@/components/journal/journal-table';
import { JournalToolbar } from '@/components/journal/journal-toolbar';
import { Oleaje } from '@/components/journal/oleaje';
import { BackLink } from '@/components/ui/back-link';
import { Button } from '@/components/ui/button';
import { SelectionBar } from '@/components/ui/selection-bar';
import { useBatchMarkdownExport } from '@/lib/journal/use-batch-export';
import { useJournalScreen } from '@/lib/journal/use-journal-screen';
import { useJournalViewStore } from '@/lib/journal/view';
import { useSelection } from '@/lib/use-selection';

/**
 * El listado del cuaderno, con sus tres formas de verlo (RFC 0017 §7.4).
 *
 * Se apoya en `useJournalScreen`, que junta la consulta paginada, los
 * filtros de la URL y las cuentas de la portada (Regla 6 §2).
 */
export function JournalListPage() {
  const { t } = useTranslation();
  const screen = useJournalScreen();
  const view = useJournalViewStore((state) => state.view);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<JournalEntryListItem | null>(null);
  const [deleting, setDeleting] = useState<JournalEntryListItem | null>(null);
  const selection = useSelection();
  const batchExport = useBatchMarkdownExport();

  /** Lo mismo alimenta la fila de la tabla y la ficha de fuera (§7.5). */
  const cells = (entry: JournalEntryListItem, index: number): EntryCells => ({
    entry,
    index,
    onEdit: () => {
      setEditing(entry);
    },
    onDelete: () => {
      setDeleting(entry);
    },
    selected: selection.selected.has(entry.id),
    onToggleSelect: () => {
      selection.toggle(entry.id);
    },
  });

  const toolbar = <JournalToolbar screen={screen} />;

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

      <SelectionBar
        count={selection.count}
        isExporting={batchExport.pending}
        onExport={() => {
          void batchExport.exportSelection([...selection.selected]).then(() => {
            selection.clear();
          });
        }}
        onClear={selection.clear}
      />

      {/* Cambiar de vista es un fundido, sin desplazamiento: no se está yendo a
          otro sitio. La clave hace que React remonte y la animación vuelva a
          lanzarse (mismo criterio que profecías §7.8). */}
      <div key={view} className="gap-3 animate-page-in flex flex-col">
        {view === 'table' && <JournalTable screen={screen} cells={cells} toolbar={toolbar} />}
        {view === 'cards' && <JournalCards screen={screen} cells={cells} toolbar={toolbar} />}
        {view === 'calendar' && (
          <>
            <div className="p-3 rounded-xl border bg-card">{toolbar}</div>
            <JournalCalendar items={screen.page?.items ?? []} />
          </>
        )}
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
