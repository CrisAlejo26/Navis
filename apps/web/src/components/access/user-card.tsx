import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/access/role-badge';
import { UserActions } from '@/components/access/user-actions';
import type { UserCellsProps } from '@/components/access/user-row';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';

/**
 * La misma cuenta que pinta `UserRow`, apilada para un teléfono: el nombre y
 * las acciones arriba, y debajo lo que acompaña. Lo importante se lee sin
 * desplazarse a lo ancho (Regla 5).
 */
export function UserCard({ user, isSelf, catalog, ...actions }: UserCellsProps) {
  const { t } = useTranslation();

  return (
    <div className="gap-3 flex flex-col">
      <div className="gap-3 flex items-start justify-between">
        <div className="min-w-0">
          <p className="gap-2 text-sm font-medium flex items-center">
            <span className="truncate">{user.name}</span>
            {isSelf && <Badge variant="outline">{t('roles.you')}</Badge>}
          </p>
          <p className="mt-0.5 text-xs truncate text-muted-foreground">{user.email}</p>
        </div>
        <UserActions isSelf={isSelf} {...actions} />
      </div>

      <div className="gap-x-3 gap-y-1.5 flex flex-wrap items-center">
        <RoleBadge slug={user.role} role={catalog.get(user.role)} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatDate(user.createdAt)}
        </span>
        {!user.emailVerified && <Badge variant="muted">{t('roles.unverified')}</Badge>}
      </div>
    </div>
  );
}
