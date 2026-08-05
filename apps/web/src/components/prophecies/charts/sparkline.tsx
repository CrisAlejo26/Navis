import { useChartTheme } from '@/components/prophecies/charts/chart-theme';

/**
 * Una línea diminuta con la forma de una serie (RFC 0004 D10).
 *
 * Es lo que hace que una tarjeta enseñe **forma** además de un número: un
 * número grande que no dice cómo ha llegado ahí es mobiliario. Se dibuja a mano
 * con un `<polyline>` —doce puntos no justifican traer un componente de la
 * librería— y va `aria-hidden`: lo que se lee es la cifra de al lado.
 */
export function Sparkline({ values }: { values: number[] }) {
  const theme = useChartTheme();
  if (values.length < 2) return null;

  const max = Math.max(...values, 1);
  const step = 100 / (values.length - 1);
  const points = values
    .map((value, index) => `${String(index * step)},${String(24 - (value / max) * 22)}`)
    .join(' ');

  return (
    <svg aria-hidden viewBox="0 0 100 24" preserveAspectRatio="none" className="h-6 w-full">
      <polyline
        points={points}
        fill="none"
        stroke={theme.fulfilled}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
