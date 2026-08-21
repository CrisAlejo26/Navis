import type { RowFilter } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Input } from '@/components/ui/input';

/** Texto, texto largo, correo, teléfono, URL: un único «contiene» (D28). */
export function TextFilterControl({
  columnKey,
  label,
  filter,
  onChange,
}: {
  columnKey: string;
  label: string;
  filter: RowFilter | undefined;
  onChange: (filter: RowFilter | null) => void;
}) {
  const { t } = useTranslation();

  return (
    <Input
      label={label}
      placeholder={t('tables.filters.contains')}
      value={typeof filter?.value === 'string' ? filter.value : ''}
      onChange={(event) => {
        const value = event.target.value;
        onChange(value ? { columnKey, operator: 'contains', value } : null);
      }}
    />
  );
}
