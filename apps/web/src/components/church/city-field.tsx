import { useCityGeocode } from '@navis/api-client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/ui/combobox';
import { api } from '@/lib/api';

/**
 * La ciudad de la iglesia, buscada contra el mismo proveedor que ya usa el
 * tiempo del panel de inicio (RFC 0011, ampliación).
 *
 * Sigue siendo texto libre —lo que se escribe **es** el valor, se elija una
 * sugerencia o no—: si el proveedor está caído o el pueblo es demasiado
 * pequeño para su índice, se rellena a mano, igual que antes. Elegir una
 * sugerencia solo añade una cortesía: la zona horaria de esa ciudad
 * (`onCitySelected`), que el campo de zona horaria puede adoptar sin que haga
 * falta ponerla dos veces.
 */
export function CityField({
  country,
  defaultValue,
  onCitySelected,
}: {
  country: string;
  defaultValue: string;
  onCitySelected: (timezone: string) => void;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(defaultValue);
  const [debounced, setDebounced] = useState(defaultValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query);
    }, 300);
    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  const enabled = debounced.trim().length >= 2;
  const { data, isFetching } = useCityGeocode(api, { q: debounced, country }, enabled);
  const items = data?.items ?? [];

  const options = items.map((city) => ({
    value: city.name,
    label: city.name,
    hint: city.region ?? undefined,
  }));

  return (
    <Combobox
      name="city"
      label={t('church.city')}
      hint={query.trim().length < 2 ? t('church.cityMinChars') : undefined}
      placeholder={t('church.searchPlaceholder')}
      required
      value={query}
      options={options}
      query={query}
      onQueryChange={setQuery}
      onSelect={(name) => {
        setQuery(name);
        const picked = items.find((one) => one.name === name);
        if (picked) onCitySelected(picked.timezone);
      }}
      loading={enabled && isFetching}
      emptyLabel={t('church.cityNoResults')}
    />
  );
}
