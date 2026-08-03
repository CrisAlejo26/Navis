import { isSystemRole, type RoleRow as Row } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RoleBadge } from '@/components/access/role-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell } from '@/components/ui/table';
import { formatNumber } from '@/lib/format';
import { ROLE_HINT_KEY } from '@/lib/roles';

interface RoleRowProps {
  role: Row;
  onEdit: () => void;
  onDelete: () => void;
}

/** Las celdas de un rol. Los de serie no se borran y solo cambian de descripción. */
export function RoleRow({ role, onEdit, onDelete }: RoleRowProps) {
  const { t } = useTranslation();
  const hint = isSystemRole(role.slug) ? t(ROLE_HINT_KEY[role.slug]) : role.description;

  return (
    <>
      <TableCell>
        <span className="gap-1 flex flex-col">
          <RoleBadge slug={role.slug} role={role} className="font-medium" />
          {hint && <span className="text-xs pl-[26px] text-muted-foreground">{hint}</span>}
        </span>
      </TableCell>

      <TableCell className="text-muted-foreground tabular-nums">{role.level}</TableCell>

      <TableCell className="text-right tabular-nums">{formatNumber(role.usersCount)}</TableCell>

      <TableCell className="text-right">
        <Badge variant={role.isSystem ? 'muted' : 'outline'}>
          {role.isSystem ? t('roles.system') : t('roles.custom')}
        </Badge>
      </TableCell>

      <TableCell>
        <span className="gap-0.5 flex justify-end">
          <Button variant="ghost" size="icon" aria-label={t('roles.editRole')} onClick={onEdit}>
            <Pencil size={16} aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={role.isSystem || role.usersCount > 0}
            title={role.isSystem ? t('roles.systemRoleLocked') : undefined}
            aria-label={t('roles.deleteRole')}
            onClick={onDelete}
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={16} aria-hidden />
          </Button>
        </span>
      </TableCell>
    </>
  );
}
