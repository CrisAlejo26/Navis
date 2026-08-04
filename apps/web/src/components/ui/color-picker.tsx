import { ACCENT_PALETTE, CONGREGATION_ACCENTS } from '@navis/shared';
import { Check, Pipette } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ACCENT_RAIL, accentColor, accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

const COLORS = [...CONGREGATION_ACCENTS, ...ACCENT_PALETTE];

/**
 * Elegir el color de algo: **veintidós muestras y la rueda del sistema**.
 *
 * Con seis colores, una iglesia con diez sedes acababa repitiendo —y el color
 * es justo lo que distingue una columna de otra de un vistazo—. Quien no
 * encuentre el suyo lo escribe en hexadecimal o lo saca de la rueda, que es la
 * que trae el sistema operativo y no una que haya que mantener aquí.
 */
export function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (color: string) => void;
  label: string;
}) {
  const { t } = useTranslation();
  // La rueda solo entiende hexadecimales; los seis tokens se le enseñan
  // resueltos a su color de tema claro, que es lo que se ve al abrirla.
  const custom = value.startsWith('#') ? value : '#2140cf';

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="text-sm font-medium">{label}</legend>

      <div className="gap-2 flex flex-wrap">
        {COLORS.map((one) => (
          <button
            key={one}
            type="button"
            aria-label={one}
            aria-pressed={one === value}
            style={accentVars(one)}
            onClick={() => {
              onChange(one);
            }}
            className={cn(
              'h-8 w-8 flex cursor-pointer items-center justify-center rounded-full',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'ring-offset-background transition active:scale-95',
              ACCENT_RAIL,
            )}
          >
            {/* La marca de elegido es un icono, no solo un borde: el color no
                puede ser lo único que informa (Regla 3). */}
            {one === value && <Check size={16} aria-hidden className="text-white" />}
          </button>
        ))}

        <label
          className={cn(
            'gap-2 px-3 h-8 flex cursor-pointer items-center rounded-full border',
            'text-xs focus-within:ring-2 focus-within:ring-ring',
            value.startsWith('#') && 'border-foreground',
          )}
        >
          <Pipette size={14} aria-hidden />
          <span>{t('calendar.customColor')}</span>
          <input
            type="color"
            value={custom}
            aria-label={t('calendar.customColor')}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            className="h-5 w-6 rounded p-0 cursor-pointer border-none bg-transparent"
          />
        </label>
      </div>

      <span
        aria-hidden
        style={{ background: accentColor(value) }}
        className="h-1.5 w-full rounded-full"
      />
    </fieldset>
  );
}
