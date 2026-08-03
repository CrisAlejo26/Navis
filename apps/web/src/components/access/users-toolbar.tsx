import type { RoleSlug } from '@navis/shared';
import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChurchSelect } from '@/components/access/church-select';
import { RoleSelect } from '@/components/access/role-select';
import { Button } from '@/components/ui/button';
import { SearchField } from '@/components/ui/search-field';

interface UsersToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  role: RoleSlug | undefined;
  onRoleChange: (role: RoleSlug | undefined) => void;
  churchId: string | null;
  onChurchChange: (churchId: string | null) => void;
  onCreate: () => void;
}

/**
 * Buscar por nombre o correo, quedarse con una iglesia o con un rol, y dar de
 * alta una cuenta. El filtro de iglesia solo sale si hay más de una.
 */
export function UsersToolbar({
  search,
  onSearchChange,
  role,
  onRoleChange,
  churchId,
  onChurchChange,
  onCreate,
}: UsersToolbarProps) {
  const { t } = useTranslation();

  return (
    <div className="gap-2 sm:flex-row flex flex-col">
      <SearchField
        value={search}
        onChange={onSearchChange}
        label={t('roles.searchUsers')}
        className="flex-1"
      />

      <ChurchSelect value={churchId} onChange={onChurchChange} className="h-10 sm:w-52" />

      <RoleSelect
        size="sm"
        value={role ?? ''}
        onChange={onRoleChange}
        allLabel={t('roles.allRoles')}
        className="h-10 sm:w-56"
      />

      <Button size="md" className="h-10 shrink-0" onClick={onCreate}>
        <UserPlus size={16} aria-hidden />
        {t('roles.newUser')}
      </Button>
    </div>
  );
}
