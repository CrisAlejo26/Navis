import { useMinistries } from '@navis/api-client';
import type { BelieverListItem, Gift } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { JourneyCounts } from '@/components/believers/journey-counts';
import { accentVars } from '@/lib/accents';
import { api } from '@/lib/api';
import { journeyOf } from '@/lib/believers/journey';
import { formatMonth } from '@/lib/format';

/**
 * **La trayectoria**: por dónde ha pasado esa persona, en orden (RFC 0012).
 *
 * Es una línea de tiempo y no otra lista de etiquetas a propósito. Las
 * etiquetas de la cabecera ya dicen **qué** tiene; esto dice **cuándo**, que es
 * lo que convierte una ficha en una historia: llegó en 2005, recibió el
 * Espíritu Santo en 2011, empezó con el sonido en 2019. Puesto en columna y
 * ordenado, eso se lee de un vistazo y una tabla no lo daría.
 *
 * Si no hay ni una fecha ni una cuenta, **no sale nada**: una sección vacía
 * prometiendo datos que nadie ha rellenado es peor que no tenerla.
 */
export function BelieverJourney({
  believer,
  gifts,
}: {
  believer: BelieverListItem;
  gifts: readonly Gift[];
}) {
  const { t } = useTranslation();
  const { data: ministries = [] } = useMinistries(api);
  const steps = journeyOf(believer, gifts, ministries, t('believers.journey.arrived'));

  const cuentas =
    believer.bibleReadings !== null ||
    believer.vivenciasReadings !== null ||
    believer.bibleInstituteTimes !== null;

  if (steps.length === 0 && !cuentas && !believer.arrivalSite) return null;

  return (
    <section className="p-5 gap-5 flex flex-col rounded-xl border bg-card">
      <div className="gap-1 flex flex-col">
        <h2 className="font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          {t('believers.journey.title')}
        </h2>
        {believer.arrivalSite && (
          <p className="text-sm">
            {t('believers.journey.arrivedAtSite', { site: believer.arrivalSite })}
          </p>
        )}
      </div>

      <JourneyCounts believer={believer} />

      {steps.length > 0 && (
        <ol className="gap-3 flex flex-col">
          {steps.map((step) => (
            <li key={step.key} className="gap-3 flex items-baseline">
              {/* El punto lleva el color de su don o de su labor: el mismo con
                  el que sale en las etiquetas de arriba, para que se reconozca
                  sin leerlo. */}
              <span
                aria-hidden
                style={step.accent ? accentVars(step.accent) : undefined}
                className={`mt-1 size-2 shrink-0 rounded-full ${
                  step.accent ? 'bg-[var(--acento)]' : 'bg-muted-foreground'
                }`}
              />
              <span className="min-w-0 text-sm flex-1">
                {t(`believers.journey.${step.kind}Line`, { what: step.label })}
              </span>
              <span className="text-xs shrink-0 text-muted-foreground tabular-nums">
                {formatMonth(step.date)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
