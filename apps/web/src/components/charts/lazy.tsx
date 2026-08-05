import { lazy } from 'react';

/**
 * Los gráficos, cargados aparte (RFC 0004 D8).
 *
 * recharts pesa ~100 kB y solo lo usa esta pantalla: cargarlo con el resto de
 * la aplicación se lo cobraría a quien nunca abre la portada de profecías. Con
 * `lazy` entra en su propio trozo y llega cuando hace falta.
 */
export const MonthlyChart = lazy(() =>
  import('./index').then((module) => ({ default: module.MonthlyChart })),
);

export const RateRing = lazy(() =>
  import('./index').then((module) => ({ default: module.RateRing })),
);

export const Sparkline = lazy(() =>
  import('./index').then((module) => ({ default: module.Sparkline })),
);
