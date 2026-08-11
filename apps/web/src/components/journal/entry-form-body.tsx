import {
  useCreateEntry,
  useDeleteEntryAudio,
  useUpdateEntry,
  useUploadEntryAudio,
} from '@navis/api-client';
import {
  DEFAULT_ENTRY_KIND,
  createEntrySchema,
  journalAudioPath,
  type EntryKind,
  type JournalEntry,
} from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { FormError } from '@/components/auth/form-error';
import { AudioField, type PendingAudio } from '@/components/audio/audio-field';
import { EntryFields } from '@/components/journal/entry-fields';
import { ReminderField, type ReminderDraft } from '@/components/believers/reminder-field';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

/** `2026-08-12T19:00:00.000Z` → `2026-08-12T19:00`, que es lo que pide el campo. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';

  const date = new Date(iso);
  const dos = (value: number) => String(value).padStart(2, '0');
  const dia = `${String(date.getFullYear())}-${dos(date.getMonth() + 1)}-${dos(date.getDate())}`;

  return `${dia}T${dos(date.getHours())}:${dos(date.getMinutes())}`;
}

/**
 * Los campos y el envío, ya con la entrada cargada (si se está editando).
 *
 * Está separado de `EntryForm` para que su estado **nazca correcto**: lo
 * monta el padre con `key` cuando llegan los datos, así que el tipo y el
 * recordatorio se inicializan de una vez y no hace falta sincronizarlos con
 * un efecto (mismo criterio que `ProphecyFormBody`).
 */
export function EntryFormBody({ entry, onSaved }: { entry?: JournalEntry; onSaved: () => void }) {
  const { t } = useTranslation();
  const create = useCreateEntry(api);
  const update = useUpdateEntry(api);
  const upload = useUploadEntryAudio(api);
  const removeAudio = useDeleteEntryAudio(api);

  const [kind, setKind] = useState<EntryKind>(entry?.kind ?? DEFAULT_ENTRY_KIND);
  const [reminder, setReminder] = useState<ReminderDraft>({
    at: toLocalInput(entry?.remindAt ?? null),
    text: entry?.remindText ?? '',
  });
  const [pending, setPending] = useState<PendingAudio[]>([]);
  const [error, setError] = useState<string | null>(null);

  // El título se lleva el foco al montar. Con `ref` y no con `autoFocus`:
  // dentro de un `<dialog>` modal el foco lo reparte el navegador al abrirlo.
  const title = useRef<HTMLInputElement>(null);
  useEffect(() => {
    title.current?.focus();
  }, []);

  /** Los audios suben **después** de guardar: antes no hay entrada a la que colgarlos. */
  const subirAudios = async (entryId: string) => {
    for (const audio of pending) {
      await upload.mutateAsync({
        entryId,
        file: audio.blob,
        filename: audio.filename,
        recorded: audio.recorded,
        durationSeconds: audio.durationSeconds,
      });
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const parsed = createEntrySchema.safeParse({
      title: formText(form.get('title')),
      kind,
      occurredAt: formText(form.get('occurredAt')),
      annotation: formText(form.get('annotation')),
      learned: optionalText(form.get('learned')),
      remindAt: reminder.at || undefined,
      remindText: reminder.at ? optionalText(form.get('remindText')) : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const guardar = entry
      ? update.mutateAsync({
          id: entry.id,
          ...parsed.data,
          // Al editar, quitar el recordatorio tiene que viajar como `null`:
          // `undefined` querría decir «no lo toques».
          remindAt: parsed.data.remindAt ?? null,
          remindText: parsed.data.remindText ?? null,
        })
      : create.mutateAsync(parsed.data);

    void guardar
      .then(async (saved: JournalEntry) => {
        await subirAudios(saved.id);
        toast.success(entry ? t('journal.updated') : t('journal.created'));
        onSaved();
      })
      .catch(() => {
        setError(pending.length > 0 ? t('common.audio.failed') : t('errors.generic'));
      });
  };

  return (
    <form onSubmit={submit} className="gap-4 min-w-0 flex flex-col" noValidate>
      <EntryFields entry={entry} kind={kind} onKindChange={setKind} titleRef={title} />

      <ReminderField
        value={reminder}
        onChange={setReminder}
        labels={{
          toggle: t('journal.reminderField'),
          when: t('journal.reminderDate'),
          what: t('journal.reminderText'),
          whatHint: t('journal.reminderHint'),
        }}
      />

      <AudioField
        saved={entry?.audios ?? []}
        path={journalAudioPath}
        filename="entrada"
        pending={pending}
        onAdd={(audio) => {
          setPending((previous) => [...previous, audio]);
        }}
        onRemovePending={(id) => {
          setPending((previous) => previous.filter((one) => one.id !== id));
        }}
        onRemoveSaved={(audioId) => {
          if (entry) removeAudio.mutate({ entryId: entry.id, audioId });
        }}
      />

      <FormError message={error} />

      <Button
        type="submit"
        size="lg"
        className="w-full"
        isLoading={create.isPending || update.isPending || upload.isPending}
      >
        {t('common.save')}
      </Button>
    </form>
  );
}
