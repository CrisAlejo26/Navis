import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { useRegionOptions } from '@/lib/geo/regions';
import { matchesQuery } from '@/lib/geo/match';

/**
 * La comunidad/provincia de la iglesia, en cascada del país (RFC 0011,
 * ampliación).
 *
 * Se monta con `key={country}` desde `ChurchFormFields`: cambiar de país tiene
 * que vaciar la comunidad elegida, porque un código de otro país no significa
 * nada aquí, y remontar es más simple que un `useEffect` que resetee a mano.
 *
 * Si el país no tiene datos en `lib/geo/regions/` (no todos los tienen: ver
 * `gen-region-data.mjs`), cae al campo de texto de siempre —el código ISO
 * 3166-2 escrito a mano—, que es exactamente el comportamiento anterior a
 * esta ampliación.
 */
export function RegionField({
  country,
  defaultValue,
}: {
  country: string;
  defaultValue: string | null;
}) {
  const { t } = useTranslation();
  const { options, loading } = useRegionOptions(country);
  const [value, setValue] = useState(defaultValue ?? '');
  const [query, setQuery] = useState('');

  const withNone = [{ value: '', label: t('church.regionNone') }, ...options];
  const filtered = withNone.filter((option) => matchesQuery(option.label, undefined, query));

  if (!loading && country && options.length === 0) {
    return (
      <Input
        name="region"
        label={t('church.region')}
        hint={t('church.regionCode')}
        defaultValue={defaultValue ?? ''}
        maxLength={10}
        autoComplete="off"
        className="uppercase"
      />
    );
  }

  return (
    <Combobox
      name="region"
      label={t('church.region')}
      hint={t('church.regionHint')}
      placeholder={t('church.searchPlaceholder')}
      disabled={!country}
      value={value}
      options={filtered}
      query={query}
      onQueryChange={setQuery}
      onSelect={setValue}
      loading={loading}
      emptyLabel={t('church.regionNoResults')}
    />
  );
}
