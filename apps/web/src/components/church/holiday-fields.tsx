import { ES_REGIONS, type Church } from '@navis/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

/**
 * De dónde es la iglesia, que es de donde salen los festivos del calendario
 * (RFC 0011).
 *
 * El país va en **código de dos letras** y no en un desplegable de doscientos:
 * la fuente los identifica así, y una lista de países traducida a seis idiomas
 * es un fichero de datos que hay que mantener para que nadie lo cambie nunca.
 *
 * La comunidad **solo se despliega para España**, que es de donde tenemos la
 * tabla de nombres: la fuente manda `ES-AN` y no «Andalucía». Para cualquier
 * otro país se escribe el código ISO 3166-2 a mano, que es un identificador de
 * verdad, y el campo dice cuál es su forma.
 */
export function HolidayFields({ church }: { church: Church }) {
  const { t } = useTranslation();
  const [country, setCountry] = useState(church.country);
  const esEspaña = country.toUpperCase() === 'ES';

  return (
    <>
      <Input
        name="country"
        label={t('church.country')}
        hint={t('church.countryHint')}
        defaultValue={church.country}
        maxLength={2}
        autoComplete="off"
        className="uppercase"
        onChange={(event) => {
          setCountry(event.target.value.toUpperCase());
        }}
      />

      {esEspaña ? (
        <Select
          name="region"
          label={t('church.region')}
          hint={t('church.regionHint')}
          defaultValue={church.region ?? ''}
        >
          <option value="">{t('church.regionNone')}</option>
          {Object.entries(ES_REGIONS).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </Select>
      ) : (
        <Input
          name="region"
          label={t('church.region')}
          hint={t('church.regionCode')}
          defaultValue={church.region ?? ''}
          maxLength={10}
          autoComplete="off"
          className="uppercase"
        />
      )}
    </>
  );
}
