import type { DashboardWeekActivity } from '@navis/shared';
import { Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { formatDay, formatNumber } from '@/lib/format';
import { wakeShape } from '@/lib/lists/wake-path';

const ANCHO = 600;
const ALTO = 72;

/**
 * Notas escritas por semana, las últimas seis (RFC 0001, D-panel).
 *
 * La misma estela que ya dibuja una lista compartida
 * (`components/lists/wake.tsx`, `wakeShape` de `lib/lists/wake-path.ts`): el
 * mismo rastro de barco para «cuánto se ha escrito», da igual si es la
 * audiencia de una lista o la actividad de toda la iglesia. Reutilizar el
 * motivo es la firma, no inventar una barra más (Regla 9 §7).
 */
export function ActivityCard({ weeks }: { weeks: readonly DashboardWeekActivity[] }) {
  const { t } = useTranslation();
  const total = weeks.reduce((suma, one) => suma + one.notes, 0);
  const shape = wakeShape(
    weeks.map((one) => one.notes),
    ANCHO,
    ALTO,
  );
  const cumbre = weeks[shape.peak];

  return (
    <div className="p-5 gap-3 flex flex-col rounded-xl border bg-card">
      <div className="gap-2 flex flex-wrap items-baseline justify-between">
        <h3 className="gap-2 text-sm font-semibold flex items-center">
          <Activity size={15} aria-hidden className="text-muted-foreground" />
          {t('home.weeklyActivity')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {t('home.weeklyActivityTotal', { count: formatNumber(total), weeks: weeks.length })}
        </p>
      </div>

      {!shape.enough ? (
        <p className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${String(ANCHO)} ${String(ALTO)}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={weeks
              .map((one) => `${formatDay(one.week, 'short')}: ${String(one.notes)}`)
              .join(', ')}
            className="animate-track-in h-[72px] w-full origin-left text-primary"
          >
            <path d={shape.area} fill="currentColor" fillOpacity={0.75} />
            <line
              x1={0}
              y1={ALTO / 2}
              x2={ANCHO}
              y2={ALTO / 2}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeOpacity={0.5}
            />
            {shape.peak >= 0 && (
              <circle
                cx={shape.points[shape.peak]?.x ?? 0}
                cy={ALTO / 2}
                r={3}
                fill="currentColor"
              />
            )}
          </svg>

          <div className="gap-1.5 flex text-[10px] text-muted-foreground">
            {weeks.map((week) => (
              <span key={week.week} className="flex-1 text-center">
                {formatDay(week.week, 'short')}
              </span>
            ))}
          </div>

          {cumbre && (
            <p className="text-xs text-muted-foreground">
              {t('home.weeklyActivityPeak', {
                week: formatDay(cumbre.week, 'short'),
                count: cumbre.notes,
              })}
            </p>
          )}
        </>
      )}
    </div>
  );
}
