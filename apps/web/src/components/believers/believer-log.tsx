import { useBelieverNotes, useNoteDays, useUpdateNote } from '@navis/api-client';
import type { BelieverNote, Gift, IsoDate, NoteKind } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DeleteNoteDialog } from '@/components/believers/delete-note-dialog';
import { NoteForm } from '@/components/believers/note-form';
import { NoteKindPills } from '@/components/believers/note-kind-pills';
import { NotesBody } from '@/components/believers/notes-body';
import { NotesViewSwitch } from '@/components/believers/notes-view-switch';
import { SearchField } from '@/components/ui/search-field';
import { api } from '@/lib/api';
import { useNotesViewStore } from '@/lib/believers/note-view';

interface LogProps {
  believerId: string;
  /** El nombre de pila, que es como se le llama en el estado vacío. */
  name: string;
  gifts: readonly Gift[];
  today: IsoDate;
  canManage: boolean;
  /** El botón principal de la ficha también abre el diálogo de nota. */
  writing: boolean;
  onWritingChange: (writing: boolean) => void;
}

/**
 * La columna derecha de la ficha: **la bitácora** y lo que se hace con ella
 * (RFC 0003 §7.5).
 *
 * Cuatro formas de mirar lo mismo (D17): la bitácora hacia atrás, una lista
 * densa para escanear, fichas para leer en paralelo y el calendario del año,
 * que es la única que enseña **los huecos**.
 *
 * La búsqueda se manda al servidor y no se filtra aquí: la bitácora se pagina,
 * así que filtrar lo ya traído solo encontraría las últimas veinte notas y eso
 * en un historial de diez años es mentir a quien busca.
 */
export function BelieverLog({
  believerId,
  name,
  gifts,
  today,
  canManage,
  writing,
  onWritingChange,
}: LogProps) {
  const { t } = useTranslation();
  const view = useNotesViewStore((state) => state.view);
  const setView = useNotesViewStore((state) => state.setView);

  const [kind, setKind] = useState<NoteKind | undefined>(undefined);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [editing, setEditing] = useState<BelieverNote | null>(null);
  const [deleting, setDeleting] = useState<BelieverNote | null>(null);

  const history = useBelieverNotes(api, believerId, { kind, search: search || undefined });
  const update = useUpdateNote(api, believerId);
  const days = useNoteDays(
    api,
    believerId,
    { from: `${String(year)}-01-01`, to: `${String(year)}-12-31` },
    view === 'calendar',
  );

  const pages = history.data?.pages ?? [];
  const notes = pages.flatMap((page) => page.items);

  /** Dar por atendido un recordatorio, o devolverlo a pendiente (D16). */
  const toggleDone = (note: BelieverNote) => {
    update.mutate({ id: note.id, remindDone: note.remindDoneAt === null });
  };

  // Ocupa el ancho entero en **todas** las vistas. La bitácora se quedaba en
  // 46 rem porque la identidad vivía en una columna a la izquierda y con ella
  // la prosa ya salía estrecha; ahora la cabecera va arriba y ese tope solo
  // dejaba media pantalla en blanco. El ancho de lectura (Regla 5 §3) se limita
  // donde toca —en el texto de cada nota— y no en el contenedor.
  return (
    <div className="gap-4 min-w-0 flex flex-col">
      <div className="gap-2 flex flex-wrap items-center">
        <SearchField
          value={search}
          onChange={setSearch}
          label={t('notes.search')}
          className="min-w-40 flex-1"
        />
        <NotesViewSwitch view={view} onChange={setView} />
      </div>

      <NoteKindPills counts={pages[0]?.counts} value={kind} onChange={setKind} />

      {/* Cambiar de vista es un fundido, sin desplazamiento: no se está yendo a
          otro sitio (§7.8). La clave hace que React remonte y se relance. */}
      <div key={view} className="animate-page-in">
        <NotesBody
          view={view}
          notes={notes}
          today={today}
          name={name}
          canManage={canManage}
          isLoading={history.isLoading}
          searching={search !== ''}
          year={year}
          days={days.data ?? []}
          onYearChange={setYear}
          onAdd={() => {
            onWritingChange(true);
          }}
          onEdit={setEditing}
          onDelete={setDeleting}
          onToggleDone={toggleDone}
        />
      </div>

      {view !== 'calendar' && history.hasNextPage && (
        <LoadMore
          isLoading={history.isFetchingNextPage}
          onClick={() => {
            void history.fetchNextPage();
          }}
        />
      )}

      {(writing || editing) && (
        <NoteForm
          open
          believerId={believerId}
          gifts={gifts}
          note={editing ?? undefined}
          onClose={() => {
            onWritingChange(false);
            setEditing(null);
          }}
        />
      )}

      <DeleteNoteDialog
        note={deleting}
        believerId={believerId}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </div>
  );
}

/** «Ver más», compartido por las tres vistas que listan notas (D11). */
function LoadMore({ isLoading, onClick }: { isLoading: boolean; onClick: () => void }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      disabled={isLoading}
      onClick={onClick}
      className="h-10 px-4 text-sm font-medium self-center rounded-lg border bg-card hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50"
    >
      {t('notes.loadMore')}
    </button>
  );
}
