import { useJournalEntry, useUpdateEntry } from '@navis/api-client';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { DeleteEntryDialog } from '@/components/journal/delete-entry-dialog';
import { EntryAnnotation } from '@/components/journal/entry-annotation';
import { EntryAudios } from '@/components/journal/entry-audios';
import { EntryForm } from '@/components/journal/entry-form';
import { EntryIdentity } from '@/components/journal/entry-identity';
import { Oleaje } from '@/components/journal/oleaje';
import { ReminderCard } from '@/components/journal/reminder-card';
import { BackLink } from '@/components/ui/back-link';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';

/**
 * La ficha de una entrada del cuaderno (RFC 0017 §7.7, cabecera revisada).
 *
 * A lo ancho y de arriba abajo, como la ficha de un sueño y la de una
 * profecía: cabecera teñida con el color del tipo, el oleaje —la firma del
 * cuaderno (D14), hasta ahora solo en la portada y el listado— y debajo el
 * texto. Antes la identidad vivía en una columna de 20 rem a la izquierda y
 * el texto empezaba a media pantalla: era la única de las tres fichas de
 * «entrada personal» sin la cabecera a lo ancho.
 */
export function JournalEntryPage() {
  const { t } = useTranslation();
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: entry, isLoading } = useJournalEntry(api, id);
  const update = useUpdateEntry(api);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (isLoading || !entry) return <PageSkeleton />;

  const markDone = () => {
    update.mutate(
      { id: entry.id, remindDone: true },
      {
        onSuccess: () => {
          toast.success(t('journal.reminderMarkedDone'));
        },
      },
    );
  };

  return (
    <section className="gap-4 animate-page-in flex flex-col">
      <BackLink to="/journal/list" label={entry.title} />

      <EntryIdentity
        entry={entry}
        onEdit={() => {
          setEditing(true);
        }}
        onDelete={() => {
          setDeleting(true);
        }}
      />

      <Oleaje />

      {entry.remindAt && (
        <ReminderCard
          remindAt={entry.remindAt}
          remindText={entry.remindText}
          remindDoneAt={entry.remindDoneAt}
          isMarking={update.isPending}
          onMarkDone={markDone}
        />
      )}

      <EntryAnnotation entry={entry} />
      <EntryAudios audios={entry.audios} />

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
