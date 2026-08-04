import type { BelieverNote, IsoDate } from '@navis/shared';
import { NotebookPen, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NoteEntry, type NoteHandlers } from '@/components/believers/note-entry';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { formatMonth } from '@/lib/format';

interface TimelineProps {
  notes: readonly BelieverNote[];
  today: IsoDate;
  name: string;
  canManage: boolean;
  isLoading: boolean;
  /** Si el vacío viene de una búsqueda, lo que falta es otra palabra, no notas. */
  searching: boolean;
  onAdd: () => void;
  onEdit: (note: BelieverNote) => void;
  onDelete: (note: BelieverNote) => void;
  onToggleDone: (note: BelieverNote) => void;
}

/** Las notas agrupadas por mes, en el orden en que ya llegan: hacia atrás. */
function byMonth(notes: readonly BelieverNote[]): [string, BelieverNote[]][] {
  const groups = new Map<string, BelieverNote[]>();

  for (const note of notes) {
    const month = note.occurredAt.slice(0, 7);
    groups.set(month, [...(groups.get(month) ?? []), note]);
  }

  return [...groups.entries()];
}

/**
 * **La bitácora**: el historial completo de un hermano, leído hacia atrás
 * (§7.5).
 *
 * El mes queda pegajoso al desplazar, que es lo que evita perder el hilo en un
 * historial de diez años.
 */
export function NotesTimeline({
  notes,
  today,
  name,
  canManage,
  isLoading,
  searching,
  onAdd,
  onEdit,
  onDelete,
  onToggleDone,
}: TimelineProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="gap-3 flex flex-col">
        {Array.from({ length: 3 }, (_unused, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="rounded-xl border bg-card">
        {searching ? (
          <EmptyState icon={SearchX} title={t('notes.noResults')}>
            {t('notes.noResultsHint')}
          </EmptyState>
        ) : (
          <EmptyState
            icon={NotebookPen}
            title={t('notes.empty', { name })}
            action={
              canManage && (
                <Button size="lg" className="mt-2" onClick={onAdd}>
                  <NotebookPen size={18} aria-hidden />
                  {t('notes.add')}
                </Button>
              )
            }
          >
            {t('notes.emptyHint')}
          </EmptyState>
        )}
      </div>
    );
  }

  const handlers = (note: BelieverNote): NoteHandlers => ({
    canManage,
    onEdit: () => {
      onEdit(note);
    },
    onDelete: () => {
      onDelete(note);
    },
    onToggleDone: () => {
      onToggleDone(note);
    },
  });

  return (
    <div className="gap-1 flex flex-col">
      {byMonth(notes).map(([month, ofMonth]) => (
        <section key={month}>
          <h3 className="py-2 font-semibold top-0 sticky z-10 bg-background text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {formatMonth(month)}
          </h3>

          <div className="divide-y">
            {ofMonth.map((note) => (
              <NoteEntry key={note.id} note={note} today={today} {...handlers(note)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
