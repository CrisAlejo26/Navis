import { afterEach, describe, expect, it, vi } from 'vitest';

import { GeocodeService } from './geocode.service';

const MADRID = {
  name: 'Madrid',
  country_code: 'ES',
  admin1: 'Comunidad de Madrid',
  latitude: 40.4,
  longitude: -3.7,
  timezone: 'Europe/Madrid',
};

/** Sin `timezone`: un resultado que se filtra, no que rompe la búsqueda. */
const SIN_ZONA = {
  name: 'Villaverde',
  country_code: 'ES',
  latitude: 40.35,
  longitude: -3.7,
};

function stubFetch(body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GeocodeService', () => {
  it('trae la ciudad con su comunidad y su zona horaria', async () => {
    stubFetch({ results: [MADRID] });

    const cities = await new GeocodeService().searchCities('Madrid');

    expect(cities).toEqual([
      {
        name: 'Madrid',
        countryCode: 'ES',
        region: 'Comunidad de Madrid',
        latitude: 40.4,
        longitude: -3.7,
        timezone: 'Europe/Madrid',
      },
    ]);
  });

  it('descarta lo que llega sin zona horaria', async () => {
    stubFetch({ results: [MADRID, SIN_ZONA] });

    const cities = await new GeocodeService().searchCities('Madrid');

    expect(cities).toHaveLength(1);
    expect(cities[0]?.name).toBe('Madrid');
  });

  it('filtra por país aunque el proveedor no lo haga', async () => {
    const otro = { ...MADRID, name: 'Madrid (US)', country_code: 'US' };
    stubFetch({ results: [MADRID, otro] });

    const cities = await new GeocodeService().searchCities('Madrid', 'ES');

    expect(cities).toHaveLength(1);
    expect(cities[0]?.countryCode).toBe('ES');
  });

  it('sin resultados no revienta', async () => {
    stubFetch({ results: [] });

    await expect(new GeocodeService().searchCities('Xxxxx')).resolves.toEqual([]);
  });

  it('con el proveedor caído devuelve la lista vacía, no un error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('sin red'))),
    );

    await expect(new GeocodeService().searchCities('Madrid')).resolves.toEqual([]);
  });
});
