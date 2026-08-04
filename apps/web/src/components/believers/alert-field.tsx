import { DEFAULT_ALERT_AFTER_DAYS, MAX_ALERT_AFTER_DAYS } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';

/**
 * El **margen de aviso**: un interruptor y un número de días (§7.6, D3).
 *
 * Apagarlo es poner `null`, no cero: un solo significado por columna. Y la
 * ayuda del campo dice para qué sirve, porque bajarlo a tres días para todo el
 * mundo convierte la pantalla en un semáforo en rojo permanente y deja de
 * informar.
 */
export function AlertField({
  value,
  onChange,
}: {
  /** Días de margen, o `null` con el aviso apagado. */
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const { t } = useTranslation();
  const on = value !== null;

  return (
    <div className="gap-3 p-3.5 flex flex-col rounded-lg border bg-muted/40">
      <label className="gap-3 flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={on}
          onChange={(event) => {
            onChange(event.target.checked ? DEFAULT_ALERT_AFTER_DAYS : null);
          }}
          className="h-4 w-4 accent-[var(--color-primary)]"
        />
        <span className="text-sm font-medium">{t('believers.alertToggle')}</span>
      </label>

      <div
        className={cn('transition-opacity duration-200', !on && 'pointer-events-none opacity-40')}
      >
        <Input
          name="alertAfterDays"
          type="number"
          inputMode="numeric"
          min={1}
          max={MAX_ALERT_AFTER_DAYS}
          disabled={!on}
          value={value ?? DEFAULT_ALERT_AFTER_DAYS}
          label={t('believers.alertDays')}
          hint={t('believers.alertHint')}
          className="tabular-nums"
          onChange={(event) => {
            const days = Number(event.target.value);
            onChange(Number.isFinite(days) && days > 0 ? days : DEFAULT_ALERT_AFTER_DAYS);
          }}
        />
      </div>
    </div>
  );
}
