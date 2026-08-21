import { useTranslation } from 'react-i18next';

import { SearchField } from '@/components/ui/search-field';
import type { TeachingsScreen } from '@/lib/teachings/use-teachings-screen';

/** Solo búsqueda: esta sección no tiene filtros de estado ni varias vistas. */
export function TeachingsToolbar({ screen }: { screen: TeachingsScreen }) {
  const { t } = useTranslation();

  return (
    <SearchField
      value={screen.query.search}
      onChange={screen.query.setSearch}
      label={t('teachings.search')}
      className="min-w-0 flex-1"
    />
  );
}
