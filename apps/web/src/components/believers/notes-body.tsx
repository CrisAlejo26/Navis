import type { BelieverNote, IsoDate, NoteDay } from '@navis/shared';

import { NotesCalendar } from '@/components/believers/notes-calendar';
import { NotesCards } from '@/components/believers/notes-cards';
import { NotesList } from '@/components/believers/notes-list';
import { NotesTimeline } from '@/components/believers/notes-timeline';
import type { NotesView } from '@/lib/believers/note-view';

interface BodyProps {
  view: NotesView;
  notes: readonly BelieverNote[];
  today: IsoDate;
  /** El nombre de pila, que es como se le llama en el estado vacío. */
  name: string;
  canManage: boolean;
  isLoading: boolean;
  searching: boolean;
  /** Solo la vista de calendario los usa. */
  year: number;
  days: readonly NoteDay[];
  onYearChange: (year: number) => void;
  onAdd: () => void;
  onEdit: (note: BelieverNote) => void;
  onDelete: (note: BelieverNote) => void;
  onToggleDone: (note: BelieverNote) => void;
}

/**
 * Cuál de las cuatro vistas se pinta (D17).
 *
 * Las tres que listan notas caen a la bitácora cuando no hay ninguna: el estado
 * vacío —«todavía no hay nada escrito de X»— es el mismo y solo tiene sentido
 * escrito una vez. El calendario no cae: un año sin notas **es** su contenido.
 */
export function NotesBody({
  view,
  notes,
  today,
  name,
  canManage,
  isLoading,
  searching,
  year,
  days,
  onYearChange,
  onAdd,
  onEdit,
  onDelete,
  onToggleDone,
}: BodyProps) {
  if (view === 'calendar') {
    return <NotesCalendar year={year} days={days} onYearChange={onYearChange} />;
  }

  if (notes.length > 0 && view === 'list') {
    return <NotesList notes={notes} canManage={canManage} onEdit={onEdit} />;
  }

  if (notes.length > 0 && view === 'cards') {
    return (
      <NotesCards
        notes={notes}
        today={today}
        canManage={canManage}
        onEdit={onEdit}
        onToggleDone={onToggleDone}
      />
    );
  }

  return (
    <NotesTimeline
      notes={notes}
      today={today}
      name={name}
      canManage={canManage}
      isLoading={isLoading}
      searching={searching}
      onAdd={onAdd}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleDone={onToggleDone}
    />
  );
}
