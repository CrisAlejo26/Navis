import type { ManagedUser, RoleRow, RoleSlug } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/access/role-badge';
import { UserActions, type UserActionHandlers } from '@/components/access/user-actions';
import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/format';

export interface UserCellsProps extends UserActionHandlers {
  user: ManagedUser;
  isSelf: boolean;
  /** El catálogo de roles, para poner nombre y nivel al de esta cuenta. */
  catalog: Map<RoleSlug, RoleRow>;
}

/** Las celdas de una cuenta, de `md` para arriba. La propia no se toca desde aquí. */
export function UserRow({ user, isSelf, catalog, ...actions }: UserCellsProps) {
  const { t } = useTranslation();

  return (
    <>
      <TableCell>
        <span className="gap-2 flex items-center">
          <span className="font-medium">{user.name}</span>
          {isSelf && <Badge variant="outline">{t('roles.you')}</Badge>}
        </span>
      </TableCell>

      <TableCell className="text-muted-foreground">
        <span className="gap-2 flex items-center">
          {user.email}
          {!user.emailVerified && <Badge variant="muted">{t('roles.unverified')}</Badge>}
        </span>
      </TableCell>

      <TableCell>
        <RoleBadge slug={user.role} role={catalog.get(user.role)} />
      </TableCell>

      {/* `medium` y no `short`: «3/8/26» se lee distinto según el país y aquí
          la fecha se mira de un vistazo, no se compara al milímetro. */}
      <TableCell className="whitespace-nowrap text-muted-foreground tabular-nums">
        {formatDate(user.createdAt)}
      </TableCell>

      <TableCell>
        <UserActions isSelf={isSelf} {...actions} />
      </TableCell>
    </>
  );
}
