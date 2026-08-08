import { z } from 'zod';

/**
 * Una ciudad encontrada por el proveedor de geocodificación (RFC 0011,
 * ampliación del selector geográfico).
 *
 * Mismo proveedor que el tiempo (`weather.ts`), así que trae lo mismo que ya
 * usa `WeatherService` —nombre y coordenadas— más lo que hace falta aquí:
 * el país, el nombre de la comunidad si la tiene y la zona horaria, para que
 * elegir la ciudad pueda rellenar la zona horaria por cortesía.
 */
export const geocodedCitySchema = z.object({
  name: z.string(),
  /** ISO 3166-1 alfa-2, tal y como lo da el proveedor. */
  countryCode: z.string(),
  /** El nombre de la comunidad/provincia, en el idioma que dio el proveedor. */
  region: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  /** Zona horaria IANA de la ciudad. */
  timezone: z.string(),
});

export type GeocodedCity = z.infer<typeof geocodedCitySchema>;

export const geocodedCitiesSchema = z.object({ items: z.array(geocodedCitySchema) });

export type GeocodedCities = z.infer<typeof geocodedCitiesSchema>;
