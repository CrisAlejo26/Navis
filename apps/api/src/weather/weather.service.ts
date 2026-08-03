import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { weatherKindOf, type Weather } from '@navis/shared';
import { z } from 'zod';

/** Cuánto vale una lectura antes de volver a preguntar. El tiempo no corre. */
const CACHE_MS = 15 * 60 * 1000;

const GEOCODING = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST = 'https://api.open-meteo.com/v1/forecast';

/**
 * Lo que se espera del proveedor. Se valida con zod porque es una frontera: lo
 * que llega de fuera se comprueba, no se declara (Regla 10).
 */
const placeSchema = z.object({
  results: z
    .array(z.object({ name: z.string(), latitude: z.number(), longitude: z.number() }))
    .nonempty(),
});

const currentSchema = z.object({
  current: z.object({ temperature_2m: z.number(), weather_code: z.number() }),
});

interface Cached {
  value: Weather;
  expiresAt: number;
}

/**
 * El tiempo de una ciudad, contra Open-Meteo.
 *
 * Se elige ese proveedor porque **no pide clave**: una instalación local no
 * tiene que registrarse en ningún sitio para que el panel funcione, y no hay un
 * secreto más que cuidar en el despliegue.
 *
 * Va por el servidor y no desde el navegador para que la ciudad de quien mira
 * no salga del servidor de la iglesia, y para poder cachear una lectura por
 * ciudad en vez de una por persona y pestaña.
 */
@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly cache = new Map<string, Cached>();

  async forCity(city: string, now = Date.now()): Promise<Weather> {
    const key = city.trim().toLowerCase();
    const hit = this.cache.get(key);
    if (hit && hit.expiresAt > now) return hit.value;

    const place = await this.geocode(city);
    const value = await this.current(place, now);

    this.cache.set(key, { value, expiresAt: now + CACHE_MS });
    return value;
  }

  private async geocode(city: string) {
    const body = await this.fetchJson(
      `${GEOCODING}?name=${encodeURIComponent(city)}&count=1&format=json`,
    );

    const parsed = placeSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceUnavailableException(`No se encuentra la ciudad "${city}"`);
    }
    return parsed.data.results[0];
  }

  private async current(
    place: { name: string; latitude: number; longitude: number },
    now: number,
  ): Promise<Weather> {
    const body = await this.fetchJson(
      `${FORECAST}?latitude=${String(place.latitude)}&longitude=${String(place.longitude)}` +
        `&current=temperature_2m,weather_code`,
    );

    const parsed = currentSchema.safeParse(body);
    if (!parsed.success) {
      throw new ServiceUnavailableException('El proveedor del tiempo devolvió algo inesperado');
    }

    return {
      city: place.name,
      temperature: Math.round(parsed.data.current.temperature_2m),
      kind: weatherKindOf(parsed.data.current.weather_code),
      observedAt: new Date(now),
    };
  }

  private async fetchJson(url: string): Promise<unknown> {
    try {
      // Con tope: el panel no puede quedarse colgado porque un tercero tarde.
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`respuesta ${String(response.status)}`);
      return await response.json();
    } catch (cause) {
      this.logger.warn(`El proveedor del tiempo falló: ${String(cause)}`);
      throw new ServiceUnavailableException('No se ha podido consultar el tiempo');
    }
  }
}
