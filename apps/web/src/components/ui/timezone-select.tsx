import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/ui/combobox';
import { matchesQuery } from '@/lib/geo/match';

/**
 * Todas las zonas horarias IANA, buscables (RFC 0011, ampliación).
 *
 * La lista la da el navegador (`Intl.supportedValuesOf`), así que está siempre
 * al día y no ocupa nada en el paquete. Donde no exista —navegadores viejos y
 * algunos WebView—, se cae a la del propio dispositivo, que es la que acierta
 * en la inmensa mayoría de los casos.
 */
function supportedTimeZones(): string[] {
  if (typeof Intl.supportedValuesOf === 'function') {
    return Intl.supportedValuesOf('timeZone');
  }
  return [Intl.DateTimeFormat().resolvedOptions().timeZone];
}

/** `Europe/Madrid` → `Europe · Madrid`, para que se lea y se busque por región. */
function labelOf(zone: string): string {
  return zone.replaceAll('_', ' ').replaceAll('/', ' · ');
}

export function TimezoneSelect({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);
  const [query, setQuery] = useState('');

  const options = useMemo(() => {
    const zones = supportedTimeZones();
    // La zona guardada puede no estar en la lista del navegador; se añade para
    // que el combobox no la pierda al abrirlo.
    if (defaultValue && !zones.includes(defaultValue)) zones.push(defaultValue);

    return zones
      .sort((a, b) => a.localeCompare(b))
      .map((zone) => ({ value: zone, label: labelOf(zone) }));
  }, [defaultValue]);

  const filtered = options.filter((option) => matchesQuery(option.label, option.value, query));

  return (
    <Combobox
      name={name}
      label={label}
      placeholder={t('church.searchPlaceholder')}
      value={value}
      options={filtered}
      query={query}
      onQueryChange={setQuery}
      onSelect={setValue}
      emptyLabel={t('church.timezoneNoResults')}
    />
  );
}
