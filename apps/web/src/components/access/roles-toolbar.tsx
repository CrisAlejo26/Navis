import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';

/** Buscar un rol por su nombre visible, y crear uno propio. */
export function RolesToolbar({
  search,
  onSearchChange,
  onCreate,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  onCreate: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="gap-2 sm:flex-row flex flex-col">
      <SearchField
        value={search}
        onChange={onSearchChange}
        label={t('roles.searchRoles')}
        className="flex-1"
      />
      <Button className="h-10 shrink-0" onClick={onCreate}>
        <Plus size={16} aria-hidden />
        {t('roles.newRole')}
      </Button>
    </div>
  );
}
