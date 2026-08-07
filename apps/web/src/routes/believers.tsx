import type { BelieverListItem } from '@navis/shared';
import { useState } from 'react';

import { BelieverForm } from '@/components/believers/believer-form';
import { BelieversExportDialog } from '@/components/believers/believers-export-dialog';
import { BulkBar } from '@/components/believers/bulk-bar';
import type { BelieverCells } from '@/components/believers/believer-row';
import { BelieversCards } from '@/components/believers/believers-cards';
import { BelieversHeader } from '@/components/believers/believers-header';
import { BelieversTable } from '@/components/believers/believers-table';
import { BelieversToolbar } from '@/components/believers/believers-toolbar';
import { DeleteBelieverDialog } from '@/components/believers/delete-believer-dialog';
import { NoteForm } from '@/components/believers/note-form';
import { useBelieversScreen } from '@/lib/believers/use-believers-screen';
import { useBelieversViewStore } from '@/lib/believers/view';

/**
 * El listado de creyentes (RFC 0003 §7).
 *
 * La pregunta que responde de un vistazo no es «¿quién está en la iglesia?»,
 * es **«¿con quién no he hablado?»**. De ahí sale todo lo demás: la sonda de
 * cada fila, el orden por última nota y la pastilla de «piden atención».
 */
export function BelieversPage() {
  const screen = useBelieversScreen();
  const view = useBelieversViewStore((state) => state.view);

  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<BelieverListItem | null>(null);
  const [noting, setNoting] = useState<BelieverListItem | null>(null);
  const [deleting, setDeleting] = useState<BelieverListItem | null>(null);
  const [exporting, setExporting] = useState(false);

  // La selección es de esta página y de este momento: cambiar de página o de
  // filtro la deja como estaba a propósito, para que nadie asigne una sede a
  // gente que ya no ve.
  const [selected, setSelected] = useState<string[]>([]);
  const enPagina = screen.page?.items ?? [];
  const todosMarcados = enPagina.length > 0 && enPagina.every((one) => selected.includes(one.id));

  const toggleAll = () => {
    setSelected(todosMarcados ? [] : enPagina.map((one) => one.id));
  };

  /** Lo mismo alimenta la fila de la tabla y la ficha (§7.4). */
  const cells = (believer: BelieverListItem, index: number): BelieverCells => ({
    believer,
    ministries: screen.ministries,
    lists: screen.lists,
    listIds: screen.memberships[believer.id],
    today: screen.today,
    canManage: screen.canManage,
    index,
    selected: selected.includes(believer.id),
    onToggleSelected: () => {
      setSelected((previous) =>
        previous.includes(believer.id)
          ? previous.filter((id) => id !== believer.id)
          : [...previous, believer.id],
      );
    },
    onNote: () => {
      setNoting(believer);
    },
    onEdit: () => {
      setEditing(believer);
    },
    onDelete: () => {
      setDeleting(believer);
    },
  });

  const toolbar = (
    <BelieversToolbar
      screen={screen}
      onExport={() => {
        setExporting(true);
      }}
    />
  );

  return (
    <section className="gap-6 flex flex-col">
      <BelieversHeader
        summary={screen.summary}
        canManage={screen.canManage}
        onAdd={() => {
          setCreating(true);
        }}
      />

      {/* La barra sale con o sin permiso de gestión: exportar lo marcado no
          cambia nada, y quien puede verlo puede copiarlo a mano (RFC 0009 D12). */}
      <BulkBar
        selected={selected}
        congregations={screen.congregations}
        lists={screen.lists}
        canManage={screen.canManage}
        canManageLists={screen.canManageLists}
        onExport={() => {
          setExporting(true);
        }}
        onDone={() => {
          setSelected([]);
        }}
        onClear={() => {
          setSelected([]);
        }}
      />

      {/* Cambiar de vista es un fundido, sin desplazamiento: no se está yendo a
          otro sitio (§7.8). La clave hace que React remonte y la animación
          vuelva a lanzarse. */}
      <div key={view} className="animate-page-in">
        {view === 'cards' ? (
          <BelieversCards screen={screen} cells={cells} toolbar={toolbar} />
        ) : (
          <BelieversTable
            screen={screen}
            cells={cells}
            toolbar={toolbar}
            allSelected={todosMarcados}
            onToggleAll={toggleAll}
          />
        )}
      </div>

      {(creating || editing) && (
        <BelieverForm
          open
          believer={editing ?? undefined}
          congregations={screen.congregations}
          gifts={screen.gifts}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {noting && (
        <NoteForm
          open
          believerId={noting.id}
          gifts={screen.gifts}
          onClose={() => {
            setNoting(null);
          }}
        />
      )}

      <DeleteBelieverDialog
        believer={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />

      {/* Con filas marcadas se lleva la selección; sin ellas, los filtros (D1). */}
      <BelieversExportDialog
        open={exporting}
        selected={selected}
        screen={screen}
        onClose={() => {
          setExporting(false);
        }}
      />
    </section>
  );
}
