import type { Church } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { CityField } from '@/components/church/city-field';
import { CountryField } from '@/components/church/country-field';
import { RegionField } from '@/components/church/region-field';
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
 *
 * País, comunidad, ciudad y zona horaria van en ese orden y en cascada (RFC
 * 0011, ampliación): el país decide qué comunidades tiene sentido enseñar
 * (`RegionField` se remonta con `key={country}`, que es más simple que un
 * efecto que resetee a mano), y elegir una ciudad puede sugerir su zona
 * horaria (`TimezoneSelect` se remonta con `key={timezoneHint}` cuando eso
 * pasa, y solo entonces).
 */
export function ChurchFormFields({ church }: { church: Church }) {
  const { t } = useTranslation();
  const [country, setCountry] = useState(church.country);
  const [timezoneHint, setTimezoneHint] = useState<string | null>(null);

  return (
    <>
      {/* `updateChurchSchema` marca los dos como opcionales porque se puede
          editar sin tocarlos, pero una vez que el campo llega no admite una
          cadena vacía (`min(2)`): en la práctica no se pueden dejar en
          blanco, y el asterisco lo dice tal y como se comporta el formulario. */}
      <Input
        name="name"
        label={t('church.name')}
        defaultValue={church.name}
        autoComplete="off"
        required
      />

      <CountryField
        defaultValue={church.country}
        onChange={(next) => {
          setCountry(next);
        }}
      />

      <RegionField
        key={country}
        country={country}
        defaultValue={country === church.country ? church.region : null}
      />

      <CityField
        country={country}
        defaultValue={church.city ?? ''}
        onCitySelected={(timezone) => {
          setTimezoneHint(timezone);
        }}
      />

      <TimezoneSelect
        key={timezoneHint ?? 'initial'}
        name="timezone"
        label={t('profile.timezone')}
        defaultValue={timezoneHint ?? church.timezone}
      />
    </>
  );
}
