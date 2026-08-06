import { type Holiday, regionLabel } from '@navis/shared';
import type { TFunction } from 'i18next';

/**
 * «Festivo nacional» o «Festivo en Andalucía».
 *
 * Va aparte de `HolidayMark` porque un módulo con un componente **solo**
 * exporta componentes (`react-refresh/only-export-components`), y lo usan los
 * dos sitios donde sale un festivo: la celda del mes y el panel del día.
 */
export function holidayScopeLabel(holiday: Holiday, t: TFunction): string {
  if (holiday.scope === 'national') return t('calendar.holidayNational');

  return t('calendar.holidayRegional', {
    region: holiday.regions.map(regionLabel).join(', '),
  });
}
