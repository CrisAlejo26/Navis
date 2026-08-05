import {
  PROPHECY_STATES,
  PROPHECY_WINDOWS,
  type PropheciesStats,
  type ProphecyWindow,
} from '@navis/shared';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { formatNumber } from '@/lib/format';
import type { ProphecyFilters } from '@/lib/prophecies/filters';
import { STATE_ICON } from '@/lib/prophecies/state-icons';

/** La clave de traducción de cada ventana. Nada de claves construidas (Regla 2 §3). */
const WINDOW_LABEL = {
  '7d': 'prophecies.windows.recent',
  '30d': 'prophecies.windows.month',
  year: 'prophecies.windows.year',
  all: 'prophecies.windows.all',
} as const satisfies Record<ProphecyWindow, string>;

/**
 * Un grupo de filtros con su rótulo.
 *
 * El rótulo no es decoración: sin él, dos filas de pastillas seguidas se leen
 * como una sola lista y nadie sabe que la de abajo filtra por **otra cosa**.
 */
function Grupo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="gap-2 min-w-0 flex flex-col">
      <span className="font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="gap-1.5 flex flex-wrap" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

/**
 * Estado y ventana de tiempo, **agrupados y rotulados** (RFC 0004 §7.4).
 *
 * Las de estado llevan su cuenta dentro: la métrica es la navegación, no un
 * panel de indicadores aparte (§7.1). Cada una lleva además su icono, para que
 * el estado no dependa solo del color (Regla 3 §7).
 *
 * En escritorio los dos grupos van en línea, separados por un filete; en
 * pantallas estrechas se apilan.
 */
export function PropheciesFilters({
  filters,
  stats,
}: {
  filters: ProphecyFilters;
  stats: PropheciesStats | undefined;
}) {
  const { t } = useTranslation();

  return (
    <div className="gap-4 lg:gap-6 lg:flex-row lg:items-start flex flex-col">
      <Grupo label={t('prophecies.columns.state')}>
        {PROPHECY_STATES.map((state) => {
          const Icon = STATE_ICON[state];
          const total = stats?.byState[state];

          return (
            <Chip
              key={state}
              active={filters.state.includes(state)}
              onClick={() => {
                filters.toggleState(state);
              }}
            >
              <Icon size={13} aria-hidden />
              {t(`prophecies.state.${state}`)}
              {total !== undefined && (
                <span className="text-muted-foreground tabular-nums">{formatNumber(total)}</span>
              )}
            </Chip>
          );
        })}
      </Grupo>

      <span aria-hidden className="lg:block hidden w-px self-stretch bg-border" />

      <Grupo label={t('prophecies.columns.received')}>
        {PROPHECY_WINDOWS.map((window) => (
          <Chip
            key={window}
            // Con un tramo a medida puesto, ninguna ventana rápida está activa:
            // decir «Todo» mientras se filtra por dos semanas sería mentir.
            active={!filters.from && !filters.to && filters.window === window}
            onClick={() => {
              filters.setWindow(window);
            }}
          >
            {t(WINDOW_LABEL[window])}
          </Chip>
        ))}
      </Grupo>
    </div>
  );
}
