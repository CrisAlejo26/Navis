import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { dayToMonth, monthToDay } from '@/lib/believers/month';

export interface MonthRow {
  key: string;
  label: string;
}

/**
 * Un campo de **mes** por cada cosa elegida arriba (RFC 0012).
 *
 * Va debajo del selector y no dentro de cada casilla: la pregunta «¿qué tiene?»
 * y la pregunta «¿desde cuándo?» son dos, y mezclarlas convierte una lista de
 * casillas que se recorre de un vistazo en una rejilla de formularios.
 *
 * Solo salen las que están marcadas, así que la sección aparece y desaparece
 * sola: sin nada elegido no hay ninguna fecha que pedir.
 */
export function MonthRows({
  rows,
  values,
  legend,
  onChange,
}: {
  rows: readonly MonthRow[];
  values: Readonly<Record<string, string | null>>;
  legend: string;
  onChange: (key: string, date: string | null) => void;
}) {
  const { t } = useTranslation();
  if (rows.length === 0) return null;

  return (
    <fieldset className="gap-2 flex flex-col">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      <p className="mb-1 text-xs text-muted-foreground">{t('believers.journey.monthHint')}</p>

      <div className="gap-2 sm:grid-cols-2 grid">
        {rows.map((row) => (
          <Input
            key={row.key}
            type="month"
            name={`month-${row.key}`}
            label={row.label}
            value={dayToMonth(values[row.key])}
            onChange={(event) => {
              onChange(row.key, monthToDay(event.target.value));
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}
