import type { RoleRow as Row } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { RoleActions, type RoleActionHandlers } from '@/components/access/role-actions';
import { RoleBadge } from '@/components/access/role-badge';
import { Badge } from '@/components/ui/badge';
import { TableCell } from '@/components/ui/table';
import { formatNumber } from '@/lib/format';
import { useRoleHint } from '@/lib/roles';

export interface RoleCellsProps extends RoleActionHandlers {
  role: Row;
}

/** Las celdas de un rol, de `md` para arriba. */
export function RoleRow({ role, ...actions }: RoleCellsProps) {
  const { t } = useTranslation();
  const hint = useRoleHint()(role);

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
        <RoleActions role={role} {...actions} />
      </TableCell>
    </>
  );
}
