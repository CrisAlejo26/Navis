import { useMemo } from 'react';

import type { SelectOption } from '@/components/ui/select';

import { TIMEZONES } from './geo-data';

/**
 * Las zonas horarias IANA, de una lista generada (`geo-data.ts`): Hermes no trae
 * `Intl.supportedValuesOf`. Si la zona guardada no está en la lista (una
 * abreviatura como «GMT» del dispositivo), se añade para no perder el valor.
 */
export function useTimezoneOptions(current: string): SelectOption<string>[] {
    return useMemo(() => {
        const all = TIMEZONES.includes(current) ? TIMEZONES : [current, ...TIMEZONES];
        return all.map((zone) => ({ value: zone, label: zone.replaceAll('_', ' ') }));
    }, [current]);
}
