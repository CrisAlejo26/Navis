import type { ListDay } from '@navis/shared';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { WakeTable } from '@/components/lists/wake-table';
import { accentVars } from '@/lib/accents';
import { formatDay, formatNumber } from '@/lib/format';
import { wakeShape } from '@/lib/lists/wake-path';

const ANCHO = 600;
const ALTO = 72;

/**
 * **La estela**: las visitas de los últimos treinta días dibujadas como el
 * rastro que deja un barco (RFC 0010 §8.4, D38).
 *
 * Es un SVG propio y no recharts: es una figura de forma fija, sin ejes y sin
 * leyenda, y meter 370 kB para dibujar un polígono sería justo lo contrario de
 * lo que dice el RFC 0005 D18.
 *
 * Y el suelo de calidad, que en un gráfico es donde más se descuida: cada día es
 * un objetivo con su etiqueta completa, debajo está la tabla con los treinta
 * datos, el día de más visitas va rotulado —el grosor no informa solo— y la
 * entrada es un `scaleX` desde el origen izquierdo, que es lo único que el
 * compositor sabe animar (Regla 9 §5).
 */
export function Wake({ days, accent }: { days: readonly ListDay[]; accent: string }) {
  const { t } = useTranslation();
  const [abierta, setAbierta] = useState(false);
  const tablaId = useId();

  const shape = wakeShape(
    days.map((one) => one.views),
    ANCHO,
    ALTO,
  );
  const total = days.reduce((suma, one) => suma + one.views, 0);

  if (!shape.enough) {
    return (
      <div className="p-5 rounded-xl border bg-card">
        <p className="text-2xl font-semibold tabular-nums">{formatNumber(total)}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t('lists.wakeTooFew')}</p>
      </div>
    );
  }

  const cumbre = days[shape.peak];

  return (
    <div className="p-5 gap-3 flex flex-col rounded-xl border bg-card" style={accentVars(accent)}>
      <div className="gap-2 flex flex-wrap items-baseline justify-between">
        <h3 className="text-sm font-semibold">{t('lists.wake')}</h3>
        {cumbre && (
          <p className="text-xs text-muted-foreground">
            {t('lists.wakePeak', { day: formatDay(cumbre.day, 'short'), views: cumbre.views })}
          </p>
        )}
      </div>

      <svg
        viewBox={`0 0 ${String(ANCHO)} ${String(ALTO)}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={t('lists.wakeLabel', { days: days.length, views: total })}
        // `animate-track-in` es el `scaleX` desde el origen izquierdo que ya usa
        // la travesía de profecías: la estela se dibuja igual y no hace falta
        // otra animación (Regla 1 §5).
        className="animate-track-in h-[72px] w-full origin-left"
      >
        <path d={shape.area} fill="var(--acento)" fillOpacity={0.75} />
        {/* La línea central sostiene la figura cuando un día viene a cero: sin
            ella, la estela se parte en islas y deja de leerse como un rastro. */}
        <line
          x1={0}
          y1={ALTO / 2}
          x2={ANCHO}
          y2={ALTO / 2}
          stroke="var(--acento)"
          strokeWidth={1.5}
          strokeOpacity={0.5}
        />
        {shape.peak >= 0 && (
          <circle cx={shape.points[shape.peak]?.x ?? 0} cy={ALTO / 2} r={3} fill="var(--acento)" />
        )}
      </svg>

      {/*
        Cada día, su objetivo y su etiqueta completa. Van encima del dibujo y no
        dentro del SVG para que el foco del teclado se vea de verdad, y son
        **botones** porque de verdad hacen algo: abren la tabla con los treinta
        datos. Un objetivo que solo recibe el foco y no lleva a ninguna parte es
        una parada de teclado que estorba.
      */}
      <ul className="flex gap-px">
        {days.map((day) => (
          <li key={day.day} className="flex-1">
            <button
              type="button"
              aria-label={t('lists.wakeDay', {
                day: formatDay(day.day),
                views: day.views,
                visitors: day.visitors,
              })}
              aria-controls={tablaId}
              onClick={() => {
                setAbierta(true);
              }}
              className="h-2 block w-full cursor-pointer rounded-full bg-[var(--acento)]/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              style={{ opacity: day.views > 0 ? 1 : 0.35 }}
            />
          </li>
        ))}
      </ul>

      <div>
        <button
          type="button"
          aria-expanded={abierta}
          aria-controls={tablaId}
          onClick={() => {
            setAbierta((one) => !one);
          }}
          className="text-xs font-medium cursor-pointer text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t('lists.seeData')}
        </button>

        {abierta && <WakeTable id={tablaId} days={days} />}
      </div>
    </div>
  );
}
