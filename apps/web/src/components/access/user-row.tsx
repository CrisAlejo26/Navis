import type { ManagedUser, RoleRow, RoleSlug } from '@navis/shared';
import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/access/role-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { formatDate } from '@/lib/format';

interface UserRowProps {
  user: ManagedUser;
  isSelf: boolean;
  /** El catálogo de roles, para poner nombre y nivel al de esta cuenta. */
  catalog: Map<RoleSlug, RoleRow>;
  onEdit: () => void;
  onChangePassword: () => void;
  onDelete: () => void;
}

/** Las celdas de una cuenta. La propia no se toca desde aquí. */
export function UserRow({
  user,
  isSelf,
  catalog,
  onEdit,
  onChangePassword,
  onDelete,
}: UserRowProps) {
  const { t } = useTranslation();

  const actions = [
    { icon: Pencil, label: t('roles.editUser'), onClick: onEdit, danger: false },
    { icon: KeyRound, label: t('roles.changePassword'), onClick: onChangePassword, danger: false },
    { icon: Trash2, label: t('roles.deleteUser'), onClick: onDelete, danger: true },
  ] as const;

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
          {!user.emailVerified && (
            <Badge variant="muted" title={t('roles.unverified')}>
              {t('roles.unverified')}
            </Badge>
          )}
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
        <span className="gap-0.5 flex justify-end">
          {actions.map(({ icon: Icon, label, onClick, danger }) => (
            <Button
              key={label}
              variant="ghost"
              size="icon"
              disabled={isSelf}
              title={isSelf ? t('roles.ownRole') : label}
              aria-label={label}
              onClick={onClick}
              className={danger ? 'hover:bg-destructive/10 hover:text-destructive' : undefined}
            >
              <Icon size={16} aria-hidden />
            </Button>
          ))}
        </span>
      </TableCell>
    </>
  );
}
