import { useJournalEntry } from '@navis/api-client';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router';

import { DeleteEntryDialog } from '@/components/journal/delete-entry-dialog';
import { EntryAnnotation } from '@/components/journal/entry-annotation';
import { EntryAudios } from '@/components/journal/entry-audios';
import { EntryForm } from '@/components/journal/entry-form';
import { EntryIdentity } from '@/components/journal/entry-identity';
import { BackLink } from '@/components/ui/back-link';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';

/**
 * La ficha de una entrada del cuaderno (RFC 0017 §7.7).
 *
 * Es una ruta y no un panel lateral: se comparte por enlace, se abre en otra
 * pestaña y tiene sitio para una anotación larga. Dos columnas de `lg` para
 * arriba —identidad pegajosa a la izquierda, texto a la derecha—; una sola
 * por debajo (Regla 5).
 */
export function JournalEntryPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: entry, isLoading } = useJournalEntry(api, id);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading || !entry) return <PageSkeleton />;

  return (
    <section className="gap-4 animate-page-in flex flex-col">
      <BackLink to="/journal/list" label={entry.title} />

      <div className="lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start gap-4 grid">
        <EntryIdentity
          entry={entry}
          onEdit={() => {
            setEditing(true);
          }}
          onDelete={() => {
            setDeleting(true);
          }}
        />

        <div className="gap-4 min-w-0 flex flex-col">
          <EntryAnnotation entry={entry} />
          <EntryAudios audios={entry.audios} />
        </div>
      </div>

      {editing && (
        <EntryForm
          open
          entryId={entry.id}
          onClose={() => {
            setEditing(false);
          }}
        />
      )}

      <DeleteEntryDialog
        entry={deleting ? entry : null}
        onClose={() => {
          setDeleting(false);
        }}
        onDeleted={() => {
          void navigate('/journal/list');
        }}
      />
    </section>
  );
}
