import { COUNTRY_CODES } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { ComboboxOption } from '@/components/ui/combobox';

/**
 * Los 249 países, con el nombre en el idioma activo (RFC 0011, ampliación del
 * selector geográfico).
 *
 * El nombre lo pone `Intl.DisplayNames`, la misma familia de API que usa
 * `TimezoneSelect` para las zonas horarias: siempre al día, sin fichero de
 * traducción que mantener, y ya en los seis idiomas de la aplicación sin una
 * clave nueva por país.
 */
export function useCountryOptions(): ComboboxOption[] {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const names = new Intl.DisplayNames([i18n.language], { type: 'region' });

    return COUNTRY_CODES.map((code) => ({
      value: code,
      label: names.of(code) ?? code,
      hint: code,
    })).sort((a, b) => a.label.localeCompare(b.label, i18n.language));
  }, [i18n.language]);
}
