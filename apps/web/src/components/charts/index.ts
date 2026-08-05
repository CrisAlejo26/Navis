/**
 * La **única** puerta de entrada a los gráficos (RFC 0004 D8).
 *
 * Ninguna pantalla importa `recharts` directamente: se importa aquí dentro y
 * nada más. Dos motivos, y los dos importan:
 *
 * 1. Si algún día el aspecto de recharts sigue cantando a plantilla pese al
 *    tematizado, cambiarlo por SVG propio es tocar esta carpeta y ninguna otra
 *    (Regla 1).
 * 2. Este módulo se carga con `React.lazy` desde la portada, así que los ~100 kB
 *    de la librería **no entran en el bundle inicial** de una aplicación en la
 *    que casi ninguna pantalla tiene gráficos.
 */
export { MonthlyChart } from './monthly-chart';
export { RateRing } from './rate-ring';
export { Sparkline } from './sparkline';
