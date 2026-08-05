import { toIsoDate } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

export interface FulfilledDraft {
  /** Vacío mientras siga abierta. Con fecha, está cumplida (D3). */
  at: string;
}

/**
 * «Ya se cumplió»: el interruptor que abre la fecha ahí mismo (RFC 0004 D6).
 *
 * Al encenderlo se propone **hoy**, que es lo que se quiere el 95 % de las
 * veces. Al apagarlo se borra la fecha y la profecía vuelve a su estado
 * anterior —«en camino» si tiene cumplimientos, «en espera» si no—; los
 * cumplimientos parciales no se tocan.
 */
export function FulfilledSwitch({
  value,
  onChange,
}: {
  value: FulfilledDraft;
  onChange: (value: FulfilledDraft) => void;
}) {
  const { t } = useTranslation();
  const on = value.at !== '';

  return (
    <div className="gap-3 p-3 flex flex-col rounded-lg border bg-muted/30">
      <label className="gap-3 text-sm font-medium flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={on}
          onChange={(event) => {
            onChange({ at: event.target.checked ? toIsoDate(new Date()) : '' });
          }}
          className="h-4 w-4 rounded cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-ring"
        />
        {t('prophecies.markFulfilled')}
      </label>

      {on ? (
        <div className="sm:max-w-56">
          <Input
            name="fulfilledAt"
            type="date"
            label={t('prophecies.fulfilledAt')}
            value={value.at}
            onChange={(event) => {
              onChange({ at: event.target.value });
            }}
          />
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('prophecies.markFulfilledHint')}</p>
      )}
    </div>
  );
}
