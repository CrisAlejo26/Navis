import { useTranslation } from 'react-i18next';

import { Select } from '@/components/ui/select';
import { useChurches } from '@/lib/churches';

/**
 * Por qué iglesia se filtran las cuentas.
 *
 * Solo aparece cuando hay más de una a la que mirar: con una sola, el filtro no
 * filtra nada y solo ocupa sitio en la barra.
 */
export function ChurchSelect({
  value,
  onChange,
  className,
}: {
  value: string | null;
  onChange: (churchId: string | null) => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const { items } = useChurches();

  if (items.length < 2) return null;

  return (
    <Select
      size="sm"
      aria-label={t('roles.filterByChurch')}
      value={value ?? ''}
      onChange={(event) => {
        onChange(event.target.value || null);
      }}
      className={className}
    >
      <option value="">{t('roles.allChurches')}</option>
      {items.map((church) => (
        <option key={church.id} value={church.id}>
          {church.name}
        </option>
      ))}
    </Select>
  );
}
