import { MAX_READ_COUNT } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { dayToMonth, monthToDay } from '@/lib/believers/month';

export interface JourneyDraft {
  arrivedAt: string | null;
  arrivalSite: string | null;
  bibleReadings: number | null;
  vivenciasReadings: number | null;
  bibleInstituteTimes: number | null;
}

/**
 * Cuándo llegó, de dónde venía y las tres cuentas (RFC 0012).
 *
 * Todo opcional y vacío por defecto: son datos que se van completando con los
 * años, y un formulario que los exija al dar de alta a alguien que acaba de
 * llegar no se rellena, se abandona.
 */
export function JourneyFields({
  draft,
  onChange,
}: {
  draft: JourneyDraft;
  onChange: (draft: JourneyDraft) => void;
}) {
  const { t } = useTranslation();

  const cuenta = (key: keyof JourneyDraft) => (value: string) => {
    const n = Number(value);
    onChange({ ...draft, [key]: value === '' || !Number.isFinite(n) ? null : Math.trunc(n) });
  };

  return (
    <fieldset className="gap-3 flex flex-col">
      <legend className="mb-1 text-sm font-medium">{t('believers.journey.title')}</legend>

      <div className="gap-3 sm:grid-cols-2 grid">
        <Input
          type="month"
          name="arrivedAt"
          label={t('believers.journey.arrivedLabel')}
          value={dayToMonth(draft.arrivedAt)}
          onChange={(event) => {
            onChange({ ...draft, arrivedAt: monthToDay(event.target.value) });
          }}
        />
        <Input
          name="arrivalSite"
          label={t('believers.journey.siteLabel')}
          hint={t('believers.journey.siteHint')}
          value={draft.arrivalSite ?? ''}
          autoComplete="off"
          onChange={(event) => {
            onChange({ ...draft, arrivalSite: event.target.value || null });
          }}
        />
      </div>

      {/* En columna y en su propia tarjeta: en fila (`sm:grid-cols-3`), el
          breakpoint mira el ancho de la ventana y no el de los ~480 px del
          modal, así que la etiqueta más larga se partía en varias líneas
          torcidas dentro de una columna de 140 px. La tarjeta (`bg-muted/40`,
          como `AlertField`) agrupa las tres cifras como lo que son. */}
      <div className="gap-3 p-3.5 flex flex-col rounded-lg border bg-muted/40">
        <Input
          type="number"
          min={0}
          max={MAX_READ_COUNT}
          name="bibleReadings"
          label={t('believers.journey.bible')}
          value={draft.bibleReadings ?? ''}
          onChange={(event) => {
            cuenta('bibleReadings')(event.target.value);
          }}
        />
        <Input
          type="number"
          min={0}
          max={MAX_READ_COUNT}
          name="vivenciasReadings"
          label={t('believers.journey.vivencias')}
          value={draft.vivenciasReadings ?? ''}
          onChange={(event) => {
            cuenta('vivenciasReadings')(event.target.value);
          }}
        />
        <Input
          type="number"
          min={0}
          max={MAX_READ_COUNT}
          name="bibleInstituteTimes"
          label={t('believers.journey.institute')}
          value={draft.bibleInstituteTimes ?? ''}
          onChange={(event) => {
            cuenta('bibleInstituteTimes')(event.target.value);
          }}
        />
      </div>
    </fieldset>
  );
}
