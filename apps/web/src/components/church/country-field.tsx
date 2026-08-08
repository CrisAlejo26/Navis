import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/ui/combobox';
import { useCountryOptions } from '@/lib/geo/countries';
import { matchesQuery } from '@/lib/geo/match';

/**
 * El país de la iglesia, buscable (RFC 0011, ampliación).
 *
 * Antes era un campo de texto de dos letras que había que saber de memoria;
 * ahora se escribe el nombre y se elige, en el idioma activo
 * (`useCountryOptions`, vía `Intl.DisplayNames`).
 */
export function CountryField({
  defaultValue,
  onChange,
}: {
  defaultValue: string;
  onChange: (code: string) => void;
}) {
  const { t } = useTranslation();
  const options = useCountryOptions();
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState('');

  const filtered = options.filter((option) => matchesQuery(option.label, option.hint, query));

  return (
    <Combobox
      name="country"
      label={t('church.country')}
      hint={t('church.countryHint')}
      placeholder={t('church.searchPlaceholder')}
      required
      value={value}
      options={filtered}
      query={query}
      onQueryChange={setQuery}
      onSelect={(next) => {
        setValue(next);
        onChange(next);
      }}
      emptyLabel={t('church.countryNoResults')}
    />
  );
}
