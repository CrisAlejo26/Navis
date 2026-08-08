import { Injectable, Logger } from '@nestjs/common';
import type { GeocodedCity } from '@navis/shared';
import { z } from 'zod';

const GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';

/**
 * Lo que da el proveedor. Se valida con zod porque es una frontera (Regla 10):
 * `admin1` y `timezone` no siempre vienen —un pueblo pequeño puede no
 * tenerlos— así que son opcionales y se normalizan a `null` en `toCity`.
 */
const resultSchema = z.object({
  name: z.string(),
  country_code: z.string(),
  admin1: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string().optional(),
});

const responseSchema = z.object({ results: z.array(resultSchema).optional() });

/**
 * La ciudad que se busca al rellenar la ficha de una iglesia (RFC 0011,
 * ampliación del selector geográfico).
 *
 * Mismo proveedor que `WeatherService` —Open-Meteo, sin clave— y mismo
 * motivo para pasar por el servidor: que la búsqueda de quien mira no salga
 * directa de su navegador. Sin caché propia: a diferencia del tiempo, aquí
 * cada tecleo es una consulta distinta y no hay nada que reutilizar entre
 * peticiones.
 */
@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  async searchCities(query: string, country?: string): Promise<GeocodedCity[]> {
    const url =
      `${GEOCODING}?name=${encodeURIComponent(query)}&count=10&format=json` +
      (country ? `&country=${encodeURIComponent(country)}` : '');

    const body = await this.fetchJson(url);
    if (body === null) return [];

    const parsed = responseSchema.safeParse(body);
    if (!parsed.success) return [];

    // Sin zona horaria no hay con qué rellenar el campo por cortesía (D14 del
    // plan), y ofrecer una ciudad a medias es peor que no ofrecerla.
    const results = (parsed.data.results ?? []).filter(hasTimezone).map(toCity);

    // El proveedor no siempre respeta `country` como filtro estricto: se
    // vuelve a filtrar aquí, que es lo que decide qué se enseña de verdad.
    return country ? results.filter((one) => one.countryCode === country) : results;
  }

  private async fetchJson(url: string): Promise<unknown> {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`respuesta ${String(response.status)}`);
      return await response.json();
    } catch (cause) {
      // Sin resultado y sin excepción: quien busca puede seguir escribiendo
      // el nombre a mano, que es el campo de respaldo (RFC 0011, D14 del plan).
      this.logger.warn(`El proveedor de ciudades falló: ${String(cause)}`);
      return null;
    }
  }
}

type WithTimezone = z.infer<typeof resultSchema> & { timezone: string };

function hasTimezone(result: z.infer<typeof resultSchema>): result is WithTimezone {
  return typeof result.timezone === 'string';
}

function toCity(result: WithTimezone): GeocodedCity {
  return {
    name: result.name,
    countryCode: result.country_code,
    region: result.admin1 ?? null,
    latitude: result.latitude,
    longitude: result.longitude,
    timezone: result.timezone,
  };
}
