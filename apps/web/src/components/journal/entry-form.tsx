import { useJournalEntry } from '@navis/api-client';
import { useTranslation } from 'react-i18next';

import { EntryFormBody } from '@/components/journal/entry-form-body';
import { Dialog } from '@/components/ui/dialog';
import { FormSkeleton } from '@/components/ui/form-skeleton';
import { api } from '@/lib/api';

/**
 * Añadir o editar una entrada (RFC 0017 §7.8).
 *
 * Al editar recibe **el identificador y no la fila del listado**, y carga la
 * entrada entera: la fila solo trae un extracto de la anotación, así que
 * guardarla desde ahí la recortaría sin avisar (mismo motivo que
 * `ProphecyForm`).
 */
export function EntryForm({
  open,
  onClose,
  entryId,
}: {
  open: boolean;
  onClose: () => void;
  /** Si viene, se edita; si no, se añade una nueva. */
  entryId?: string;
}) {
  const { t } = useTranslation();
  const { data: entry } = useJournalEntry(api, entryId ?? '', open && Boolean(entryId));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(42rem, calc(100vw - 2rem))"
      title={entryId ? t('journal.edit') : t('journal.add')}
    >
      {entryId && !entry ? (
        <FormSkeleton />
      ) : (
        <EntryFormBody key={entry?.id ?? 'nueva'} entry={entry} onSaved={onClose} />
      )}
    </Dialog>
  );
}
