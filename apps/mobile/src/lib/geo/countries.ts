import { COUNTRY_CODES } from '@navis/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { SelectOption } from '@/components/ui/select';

import { COUNTRY_NAMES } from './geo-data';

/**
 * Los países con el nombre en el idioma activo. Los nombres vienen de una tabla
 * generada (`geo-data.ts`) y no de `Intl.DisplayNames`, que Hermes no trae.
 */
export function useCountryOptions(): SelectOption<string>[] {
    const { i18n } = useTranslation();

    return useMemo(() => {
        const names = COUNTRY_NAMES[i18n.language] ?? COUNTRY_NAMES.es ?? {};
        return COUNTRY_CODES.map((code) => ({ value: code, label: names[code] ?? code })).sort(
            (a, b) => a.label.localeCompare(b.label, i18n.language),
        );
    }, [i18n.language]);
}
