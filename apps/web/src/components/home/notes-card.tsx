import type { DashboardNote } from '@navis/shared';
import { NotebookText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { NOTE_STYLES } from '@/lib/believers/note-kinds';
import { formatDay } from '@/lib/format';

/** Las últimas entradas de la bitácora, de cualquier persona (RFC 0001). */
export function NotesCard({ notes }: { notes: readonly DashboardNote[] }) {
  const { t } = useTranslation();

  return (
    <Card className="p-0 gap-0 flex flex-col overflow-hidden">
      <div className="p-5 pb-3 gap-2 flex items-center text-muted-foreground">
        <NotebookText size={16} aria-hidden />
        <p className="text-sm font-medium">{t('home.recentNotes')}</p>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={NotebookText} title={t('home.noRecentNotes')} />
      ) : (
        <ul className="divide-y">
          {notes.map((note) => {
            const style = NOTE_STYLES[note.kind];
            const Icon = style?.Icon ?? NotebookText;

            return (
              <li key={note.id} className="px-5 py-2.5">
                <div className="gap-1.5 flex items-center">
                  <Icon size={13} aria-hidden className="shrink-0 text-muted-foreground" />
                  <p className="text-sm font-medium truncate">{note.believerName}</p>
                  <span className="text-xs ml-auto shrink-0 text-muted-foreground">
                    {formatDay(note.occurredAt, 'short')}
                  </span>
                </div>
                <p className="mt-0.5 text-xs line-clamp-1 text-muted-foreground">{note.excerpt}</p>
              </li>
            );
          })}
        </ul>
      )}

      <Link
        to="/believers"
        className="p-5 pt-3 text-xs font-medium mt-auto text-primary underline-offset-4 hover:underline"
      >
        {t('home.believersLink')}
      </Link>
    </Card>
  );
}
