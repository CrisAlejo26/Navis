import type { Church } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { HolidayFields } from '@/components/church/holiday-fields';
import { Input } from '@/components/ui/input';
import { TimezoneSelect } from '@/components/ui/timezone-select';

/**
 * Los campos de la ficha de una iglesia, **en un solo sitio**.
 *
 * Se editan desde dos lados —el diálogo de la barra lateral y la página de
 * ajustes— y tienen que ser los mismos campos: uno añadido en un lado y no en
 * el otro es un ajuste que aparece o desaparece según por dónde se entre.
 *
 * El identificador no está a propósito: se derivó del nombre al crearla y no
 * cambia, porque va en las URL (ver `ChurchesService.update`).
 */
export function ChurchFormFields({ church }: { church: Church }) {
  const { t } = useTranslation();

  return (
    <>
      <Input name="name" label={t('church.name')} defaultValue={church.name} autoComplete="off" />
      <Input
        name="city"
        label={t('church.city')}
        defaultValue={church.city ?? ''}
        autoComplete="off"
      />
      <TimezoneSelect
        name="timezone"
        label={t('profile.timezone')}
        defaultValue={church.timezone}
      />
      <HolidayFields church={church} />
    </>
  );
}
