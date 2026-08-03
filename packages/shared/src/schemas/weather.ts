import { z } from 'zod';

/**
 * Las familias de tiempo que distingue la interfaz.
 *
 * El proveedor devuelve códigos WMO (0…99) y aquí se agrupan en ocho: son los
 * que tienen icono y nombre propio. Más precisión no cabe en una línea del
 * panel, y menos no distingue la niebla del chaparrón.
 */
export const WEATHER_KINDS = [
  'clear',
  'cloudy',
  'fog',
  'drizzle',
  'rain',
  'snow',
  'showers',
  'storm',
] as const;

export type WeatherKind = (typeof WEATHER_KINDS)[number];

/** De código WMO a familia. La tabla está en open-meteo.com/en/docs. */
export function weatherKindOf(code: number): WeatherKind {
  if (code <= 1) return 'clear';
  if (code <= 3) return 'cloudy';
  if (code <= 48) return 'fog';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 77) return 'snow';
  if (code <= 82) return 'showers';
  if (code <= 86) return 'snow';
  return 'storm';
}

/** El tiempo ahora mismo donde lo haya configurado quien mira el panel. */
export const weatherSchema = z.object({
  /** Tal y como lo devuelve el proveedor, que puede corregir lo que se escribió. */
  city: z.string(),
  /** Grados centígrados. */
  temperature: z.number(),
  kind: z.enum(WEATHER_KINDS),
  observedAt: z.coerce.date(),
});

export type Weather = z.infer<typeof weatherSchema>;
