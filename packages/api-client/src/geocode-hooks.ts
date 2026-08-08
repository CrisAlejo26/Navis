import type { GeocodedCities } from '@navis/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { ApiClient } from './client';
import { queryKeys } from './query-keys';

function toGeocodeSearch(query: { q: string; country?: string }): string {
  const params = new URLSearchParams({ q: query.q });
  if (query.country) params.set('country', query.country);
  return params.toString();
}

/**
 * Las ciudades que coinciden con lo escrito, para el campo de ciudad del
 * selector geográfico (RFC 0011, ampliación).
 *
 * `enabled` lo decide quien llama —normalmente `q.length >= 2`, para no
 * disparar la búsqueda con una letra sola—.
 */
export function useCityGeocode(
  api: ApiClient,
  query: { q: string; country?: string },
  enabled: boolean,
): UseQueryResult<GeocodedCities> {
  return useQuery({
    queryKey: queryKeys.geocode.cities(query),
    queryFn: () => api.get<GeocodedCities>(`/geocode/cities?${toGeocodeSearch(query)}`),
    enabled: enabled && query.q.trim().length >= 2,
  });
}
