import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WeatherService } from './weather.service';

const PLACE = { results: [{ name: 'Madrid', latitude: 40.41, longitude: -3.7 }] };
const CURRENT = { current: { temperature_2m: 21.6, weather_code: 61 } };

/**
 * `fetch` es global y el servicio no lo recibe por parámetro: se sustituye aquí
 * en vez de inyectarlo para no meter un token de DI en el módulo solo por el
 * test. Lo que se prueba es la caché y la traducción del código WMO, no cómo se
 * hace la petición.
 */
function stubFetch(...responses: unknown[]) {
  const fetchMock = vi.fn();
  for (const body of responses) {
    fetchMock.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(body) });
  }
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('WeatherService', () => {
  it('traduce el código del proveedor y redondea la temperatura', async () => {
    stubFetch(PLACE, CURRENT);

    const weather = await new WeatherService().forCity('Madrid');

    expect(weather).toMatchObject({ city: 'Madrid', temperature: 22, kind: 'rain' });
  });

  // Una lectura por ciudad y cuarto de hora: el tiempo no corre y el proveedor
  // es de otro.
  it('no vuelve a preguntar dentro del cuarto de hora', async () => {
    const fetchMock = stubFetch(PLACE, CURRENT);
    const service = new WeatherService();

    await service.forCity('Madrid', 0);
    await service.forCity('  madrid ', 60_000);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('vuelve a preguntar cuando la lectura ha caducado', async () => {
    const fetchMock = stubFetch(PLACE, CURRENT, PLACE, CURRENT);
    const service = new WeatherService();

    await service.forCity('Madrid', 0);
    await service.forCity('Madrid', 16 * 60 * 1000);

    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('avisa cuando la ciudad no existe', async () => {
    stubFetch({ results: [] });

    await expect(new WeatherService().forCity('Xxxxx')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('avisa cuando el proveedor no responde', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('sin red'))),
    );

    await expect(new WeatherService().forCity('Madrid')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
