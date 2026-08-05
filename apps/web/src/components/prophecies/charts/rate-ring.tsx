import { useTranslation } from 'react-i18next';

import { useChartTheme } from '@/components/prophecies/charts/chart-theme';

const RADIUS = 34;
const LENGTH = 2 * Math.PI * RADIUS;

/**
 * El anillo de la tasa de cumplimiento (RFC 0004 §7.3).
 *
 * Se dibuja **a mano** con un `<circle>` y `stroke-dasharray`, no con el donut
 * de la librería: es una sola cifra y merecía cincuenta líneas propias antes
 * que un componente genérico con leyenda, tooltip y sectores que aquí no pintan
 * nada (Regla 9).
 *
 * `rate` es `null` cuando todavía no hay ninguna profecía: cero por ciento y
 * «todavía no hay nada» son cosas distintas y se pintan distinto (§6.2).
 */
export function RateRing({ rate }: { rate: number | null }) {
  const { t, i18n } = useTranslation();
  const theme = useChartTheme();
  const porcentaje = new Intl.NumberFormat(i18n.language, {
    style: 'percent',
    maximumFractionDigits: 0,
  });

  return (
    // `span` y no `div`: la tarjeta lo pinta dentro de su valor, que es un
    // `<span>`. Un `div` ahí dentro es HTML inválido.
    <span className="relative inline-flex shrink-0">
      <svg
        width={88}
        height={88}
        viewBox="0 0 88 88"
        role="img"
        aria-label={t('prophecies.stats.rate')}
      >
        <circle
          cx={44}
          cy={44}
          r={RADIUS}
          fill="none"
          stroke={theme.track}
          strokeWidth={7}
          opacity={0.6}
        />
        {rate !== null && (
          <circle
            cx={44}
            cy={44}
            r={RADIUS}
            fill="none"
            stroke={theme.fulfilled}
            strokeWidth={7}
            strokeLinecap="round"
            strokeDasharray={LENGTH}
            strokeDashoffset={LENGTH * (1 - rate)}
            // Se llena de cero a su valor al entrar. `prefers-reduced-motion`
            // lo apaga desde `global.css`, como todo lo demás (§7.8).
            className="animate-ring-in origin-center -rotate-90"
            style={{ '--ring-length': LENGTH } as React.CSSProperties}
          />
        )}
      </svg>

      <span className="inset-0 text-lg font-semibold absolute flex items-center justify-center tabular-nums">
        {rate === null ? '—' : porcentaje.format(rate)}
      </span>
    </span>
  );
}
