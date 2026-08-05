import type { DreamWeekdayCount } from '@navis/shared';

import { formatWeekday } from '@/lib/format';

const SIZE = 200;
const CENTER = SIZE / 2;
/** Donde arrancan los radios: el hueco del centro es lo que lo hace un reloj. */
const INNER = 26;
const OUTER = 74;
const LABEL = 88;

interface Radio {
  weekday: number;
  count: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  trackX: number;
  trackY: number;
  labelX: number;
  labelY: number;
}

/**
 * **El reloj de la semana**: siete radios, uno por noche (RFC 0005 §7.3).
 *
 * Dibujado a mano y no con recharts, y por dos motivos. El primero es que su
 * `RadialBarChart` pinta un **anillo por dato**, no un radio por dato: siete
 * círculos concéntricos no se leen como una semana, se leen como una diana.
 * El segundo, que sin librería esta portada no carga ni un kilobyte de gráficos.
 *
 * Cada radio arranca del mismo sitio y crece hacia fuera con lo que se sueña
 * ese día. Detrás va su carril tenue, que es lo que deja ver **cuánto falta**
 * para el máximo — sin él, un radio corto y uno largo no se comparan.
 */
export function WeeklyClock({ days }: { days: DreamWeekdayCount[] }) {
  // De lunes a domingo, empezando arriba: el dato viaja con domingo primero.
  const ordered = [...days].sort((a, b) => ((a.weekday + 6) % 7) - ((b.weekday + 6) % 7));
  const max = Math.max(...ordered.map((day) => day.count), 1);

  const radios: Radio[] = ordered.map((day, index) => {
    const angle = (-90 + index * (360 / 7)) * (Math.PI / 180);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const length = INNER + (OUTER - INNER) * (day.count / max);

    return {
      weekday: day.weekday,
      count: day.count,
      x1: CENTER + INNER * cos,
      y1: CENTER + INNER * sin,
      x2: CENTER + length * cos,
      y2: CENTER + length * sin,
      trackX: CENTER + OUTER * cos,
      trackY: CENTER + OUTER * sin,
      labelX: CENTER + LABEL * cos,
      labelY: CENTER + LABEL * sin,
    };
  });

  return (
    <svg
      viewBox={`0 0 ${String(SIZE)} ${String(SIZE)}`}
      className="max-h-72 max-w-72 h-full w-full"
      aria-hidden
    >
      {radios.map((radio) => (
        <g key={radio.weekday}>
          <line
            x1={radio.x1}
            y1={radio.y1}
            x2={radio.trackX}
            y2={radio.trackY}
            strokeWidth={13}
            strokeLinecap="round"
            className="stroke-muted"
          />
          {radio.count > 0 && (
            <line
              x1={radio.x1}
              y1={radio.y1}
              x2={radio.x2}
              y2={radio.y2}
              strokeWidth={13}
              strokeLinecap="round"
              className="stroke-primary"
            />
          )}
          {/* El día y su número juntos, en la punta del radio: el radio dice la
              forma y esto dice cuánto. Separarlos en una lista debajo obligaba
              a leer dos veces los mismos siete días. */}
          <text
            x={radio.labelX}
            y={radio.labelY - 5}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-[11px] uppercase"
          >
            {formatWeekday(radio.weekday).slice(0, 2)}
          </text>
          <text
            x={radio.labelX}
            y={radio.labelY + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            className={
              radio.count === max
                ? 'font-semibold fill-primary text-[12px]'
                : 'font-medium fill-foreground text-[12px]'
            }
          >
            {radio.count}
          </text>
        </g>
      ))}
    </svg>
  );
}
