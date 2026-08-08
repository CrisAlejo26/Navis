import { type Holiday, regionLabel } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { useRegionNames } from '@/lib/geo/regions';

/**
 * «Festivo nacional» o «Festivo en Andalucía», para **cualquier país** con
 * datos (RFC 0011, ampliación).
 *
 * Los nombres de comunidad se cargan perezosos por país (`useRegionNames`):
 * la primera vez que aparece un festivo de un país sin cargar todavía se ve
 * el código un instante y el nombre en cuanto llega su fichero. `regionLabel`
 * (`packages/shared`) se queda como respaldo síncrono para España, que nunca
 * necesita esperar a nada.
 *
 * Hook y no función suelta porque la resolución es asíncrona: `holidayScopeLabel`
 * ya no puede ser una función pura. Los dos sitios donde sale un festivo —la
 * celda del mes y el panel del día— lo llaman igual, y acepta `undefined`
 * porque el panel del día no siempre tiene festivo y las reglas de los hooks
 * no dejan llamarlo condicionalmente.
 */
export function useHolidayScopeLabel(holiday: Holiday | null | undefined): string {
  const { t } = useTranslation();
  const names = useRegionNames(holiday?.scope === 'regional' ? holiday.regions : []);

  if (!holiday) return '';
  if (holiday.scope === 'national') return t('calendar.holidayNational');

  return t('calendar.holidayRegional', {
    region: holiday.regions.map((code) => names[code] ?? regionLabel(code)).join(', '),
  });
}
