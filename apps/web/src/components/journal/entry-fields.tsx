import { toIsoDate, type EntryKind, type JournalEntry } from '@navis/shared';
import { useState, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { EntryKindPicker } from '@/components/journal/entry-kind-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface FieldsProps {
  entry?: JournalEntry;
  kind: EntryKind;
  onKindChange: (kind: EntryKind) => void;
  /** El título se lleva el foco al abrir (§7.8). */
  titleRef: RefObject<HTMLInputElement | null>;
}

/**
 * Lo que se pide de una entrada (§7.8): título, tipo, fecha, la anotación y,
 * si hace falta, la reflexión.
 *
 * «Lo aprendido» nace plegada tras un enlace: no todo lo que se anota tiene
 * una reflexión encima, y mostrar el campo vacío de serie invitaría a
 * rellenarlo por rellenar.
 */
export function EntryFields({ entry, kind, onKindChange, titleRef }: FieldsProps) {
  const { t } = useTranslation();
  const [learnedOpen, setLearnedOpen] = useState(Boolean(entry?.learned));

  return (
    <>
      <Input
        ref={titleRef}
        name="title"
        label={t('journal.titleField')}
        placeholder={t('journal.titlePlaceholder')}
        defaultValue={entry?.title}
        maxLength={200}
        required
      />

      <EntryKindPicker value={kind} onChange={onKindChange} label={t('journal.kindField')} />

      <Input
        name="occurredAt"
        type="date"
        label={t('journal.occurredAtField')}
        defaultValue={entry?.occurredAt ?? toIsoDate(new Date())}
        required
      />

      <Textarea
        name="annotation"
        rows={10}
        label={t('journal.annotationField')}
        placeholder={t('journal.annotationPlaceholder')}
        defaultValue={entry?.annotation}
        className="max-w-prose"
        required
      />

      {learnedOpen ? (
        <Textarea
          name="learned"
          rows={6}
          label={t('journal.learnedField')}
          placeholder={t('journal.learnedPlaceholder')}
          defaultValue={entry?.learned ?? ''}
          className="max-w-prose"
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setLearnedOpen(true);
          }}
          className="text-sm font-medium self-start text-primary hover:underline"
        >
          {t('journal.addLearned')}
        </button>
      )}
    </>
  );
}
