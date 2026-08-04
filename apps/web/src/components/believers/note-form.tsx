import {
  useCreateNote,
  useDeleteNoteAudio,
  useUpdateNote,
  useUploadNoteAudio,
} from '@navis/api-client';
import {
  DEFAULT_NOTE_KIND,
  createNoteSchema,
  type BelieverNote,
  type Gift,
  type NoteKind,
} from '@navis/shared';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { AudioField, type PendingAudio } from '@/components/believers/audio-field';
import { NoteFields } from '@/components/believers/note-fields';
import { ReminderField, type ReminderDraft } from '@/components/believers/reminder-field';
import { FormError } from '@/components/auth/form-error';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { formText, optionalText } from '@/lib/form';
import { toast } from '@/lib/toast';

interface NoteFormProps {
  open: boolean;
  onClose: () => void;
  believerId: string;
  gifts: readonly Gift[];
  /** Si viene, se edita; si no, se escribe una nueva. */
  note?: BelieverNote;
}

/** `2026-08-12T19:00:00.000Z` → `2026-08-12T19:00`, que es lo que pide el campo. */
function toLocalInput(iso: string | null): string {
  if (!iso) return '';

  const date = new Date(iso);
  const dos = (value: number) => String(value).padStart(2, '0');
  const dia = `${String(date.getFullYear())}-${dos(date.getMonth() + 1)}-${dos(date.getDate())}`;

  return `${dia}T${dos(date.getHours())}:${dos(date.getMinutes())}`;
}

/**
 * Escribir una nota (§7.6).
 *
 * Los campos son los de una conversación pastoral de verdad: de qué va, cuándo
 * pasó, **lo que me contó**, **la indicación dada**, y —si hace falta— un
 * recordatorio con día y hora. Los audios se graban o se adjuntan aquí y suben
 * al guardar, porque necesitan una nota a la que colgarse.
 */
export function NoteForm({ open, onClose, believerId, gifts, note }: NoteFormProps) {
  const { t } = useTranslation();
  const create = useCreateNote(api, believerId);
  const update = useUpdateNote(api, believerId);
  const upload = useUploadNoteAudio(api, believerId);
  const removeAudio = useDeleteNoteAudio(api, believerId);

  const [kind, setKind] = useState<NoteKind>(note?.kind ?? DEFAULT_NOTE_KIND);
  const [giftId, setGiftId] = useState(note?.giftId ?? '');
  const [reminder, setReminder] = useState<ReminderDraft>({
    at: toLocalInput(note?.remindAt ?? null),
    text: note?.remindText ?? '',
  });
  const [pending, setPending] = useState<PendingAudio[]>([]);
  const [error, setError] = useState<string | null>(null);

  // «Lo que me contó» se lleva el foco al abrir porque es a lo que se viene
  // (§7.6). Va con un `ref` y no con `autoFocus`: dentro de un `<dialog>` modal
  // el foco lo reparte el navegador al abrirlo, así que se pide después.
  const told = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (open) told.current?.focus();
  }, [open]);

  /** Los audios suben **después** de guardar: antes no hay nota a la que colgarlos. */
  const subirAudios = async (noteId: string) => {
    for (const audio of pending) {
      await upload.mutateAsync({
        noteId,
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

    const parsed = createNoteSchema.safeParse({
      kind,
      occurredAt: formText(form.get('occurredAt')),
      told: formText(form.get('told')),
      advice: optionalText(form.get('advice')),
      giftId: kind === 'don' ? giftId || undefined : undefined,
      remindAt: reminder.at || undefined,
      remindText: reminder.at ? optionalText(form.get('remindText')) : undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t('errors.validation'));
      return;
    }

    setError(null);
    const guardar = note
      ? update.mutateAsync({
          id: note.id,
          ...parsed.data,
          // Al editar, quitar el recordatorio tiene que viajar como `null`:
          // `undefined` querría decir «no lo toques».
          remindAt: parsed.data.remindAt ?? null,
          remindText: parsed.data.remindText ?? null,
        })
      : create.mutateAsync(parsed.data);

    void guardar
      .then(async (saved) => {
        await subirAudios(saved.id);
        toast.success(t('notes.saved'));
        onClose();
      })
      .catch(() => {
        setError(pending.length > 0 ? t('notes.audio.failed') : t('errors.generic'));
      });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      width="min(38rem, calc(100vw - 2rem))"
      title={note ? t('notes.edit') : t('notes.add')}
    >
      <form onSubmit={submit} className="gap-4 flex flex-col" noValidate>
        <NoteFields
          note={note}
          gifts={gifts}
          kind={kind}
          onKindChange={setKind}
          giftId={giftId}
          onGiftChange={setGiftId}
          toldRef={told}
        />

        <ReminderField value={reminder} onChange={setReminder} />

        <AudioField
          saved={note?.audios ?? []}
          pending={pending}
          onAdd={(audio) => {
            setPending((previous) => [...previous, audio]);
          }}
          onRemovePending={(id) => {
            setPending((previous) => previous.filter((one) => one.id !== id));
          }}
          onRemoveSaved={(audioId) => {
            if (note) removeAudio.mutate({ noteId: note.id, audioId });
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
    </Dialog>
  );
}
