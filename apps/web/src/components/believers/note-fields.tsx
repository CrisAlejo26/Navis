import { toIsoDate, type BelieverNote, type Gift, type NoteKind } from '@navis/shared';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { NoteKindPicker } from '@/components/believers/note-kind-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface FieldsProps {
  note?: BelieverNote;
  gifts: readonly Gift[];
  kind: NoteKind;
  onKindChange: (kind: NoteKind) => void;
  giftId: string;
  onGiftChange: (giftId: string) => void;
  /** «Lo que me contó» se lleva el foco al abrir: es a lo que se viene (§7.6). */
  toldRef: RefObject<HTMLTextAreaElement | null>;
}

/**
 * Lo que se pide de una nota (§7.6, D15): de qué va, cuándo pasó, **lo que me
 * contó** y **la indicación dada**.
 *
 * El tipo va primero porque decide el resto: si es «don», aparece el selector.
 * Los textos van sin estado —los lee `FormData` al enviar—; el tipo y el don sí
 * lo llevan, porque no son campos con `name` que el navegador sepa recoger.
 */
export function NoteFields({
  note,
  gifts,
  kind,
  onKindChange,
  giftId,
  onGiftChange,
  toldRef,
}: FieldsProps) {
  const { t } = useTranslation();
  const available = gifts.filter((gift) => gift.isActive || gift.id === giftId);

  return (
    <>
      <NoteKindPicker value={kind} onChange={onKindChange} label={t('notes.kind')} />

      <div className="gap-3 sm:grid-cols-2 grid">
        <Input
          name="occurredAt"
          type="date"
          label={t('notes.date')}
          defaultValue={note?.occurredAt ?? toIsoDate(new Date())}
          required
        />

        {kind === 'don' && (
          <Select
            name="giftId"
            label={t('notes.gift')}
            value={giftId}
            onChange={(event) => {
              onGiftChange(event.target.value);
            }}
            required
          >
            <option value="">{t('gifts.none')}</option>
            {available.map((gift) => (
              <option key={gift.id} value={gift.id}>
                {gift.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {kind === 'don' && (
        <p className="-mt-2 text-xs text-muted-foreground">{t('notes.giftHint')}</p>
      )}

      <Textarea
        ref={toldRef}
        name="told"
        rows={5}
        label={t('notes.told')}
        defaultValue={note?.told}
        required
      />

      <Textarea
        name="advice"
        rows={3}
        label={t('notes.advice')}
        defaultValue={note?.advice ?? ''}
        hint={t('notes.adviceHint')}
      />
    </>
  );
}
