import { toIsoDate, type BelieverNote, type Gift, type NoteKind } from '@navis/shared';
import type { RefObject } from 'react';
import { useTranslation } from 'react-i18next';

import { NoteKindPicker } from '@/components/believers/note-kind-picker';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

/** Las dos áreas de texto comparten estilo: el mismo campo, distinto alto. */
const AREA =
  'px-3.5 py-3 leading-relaxed w-full resize-y rounded-lg border bg-card text-[15px] ' +
  'text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/35';

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
        />

        {kind === 'don' && (
          <Select
            name="giftId"
            label={t('notes.gift')}
            value={giftId}
            onChange={(event) => {
              onGiftChange(event.target.value);
            }}
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

      <label className="gap-2 flex flex-col">
        <span className="text-sm font-medium">{t('notes.told')}</span>
        <textarea ref={toldRef} name="told" rows={5} defaultValue={note?.told} className={AREA} />
      </label>

      <label className="gap-2 flex flex-col">
        <span className="text-sm font-medium">{t('notes.advice')}</span>
        <textarea name="advice" rows={3} defaultValue={note?.advice ?? ''} className={AREA} />
        <span className="text-xs text-muted-foreground">{t('notes.adviceHint')}</span>
      </label>
    </>
  );
}
