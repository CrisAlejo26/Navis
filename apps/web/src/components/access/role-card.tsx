import { useTranslation } from 'react-i18next';

import { RoleActions } from '@/components/access/role-actions';
import { RoleBadge } from '@/components/access/role-badge';
import type { RoleCellsProps } from '@/components/access/role-row';
import { Badge } from '@/components/ui/badge';
import { accentVars } from '@/lib/accents';
import { formatNumber } from '@/lib/format';
import { roleAccent, useRoleHint } from '@/lib/roles';

/**
 * El mismo rol que pinta `RoleRow`, apilado para un teléfono. El filete
 * izquierdo lleva el color de su nivel (`roleAccent`), igual que la fila de
 * la tabla y que ya hace `EntryCard` con el tipo de una anotación.
 */
export function RoleCard({ role, ...actions }: RoleCellsProps) {
  const { t } = useTranslation();
  const hint = useRoleHint()(role);

  return (
    <div
      style={accentVars(roleAccent(role.level))}
      className="pl-3 gap-3 flex flex-col border-l-[3px] border-l-[var(--acento)]"
    >
      <div className="gap-3 flex items-start justify-between">
        <div className="min-w-0">
          <RoleBadge slug={role.slug} role={role} className="font-medium" />
          {hint && <p className="mt-1 text-xs pl-[26px] text-muted-foreground">{hint}</p>}
        </div>
        <RoleActions role={role} {...actions} />
      </div>

      <div className="gap-x-4 gap-y-1.5 text-xs flex flex-wrap items-center pl-[26px] text-muted-foreground">
        <span className="tabular-nums">
          {t('roles.columnLevel')}: {role.level}
        </span>
        <span className="tabular-nums">
          {t('roles.columnAccounts')}: {formatNumber(role.usersCount)}
        </span>
        <Badge variant={role.isSystem ? 'muted' : 'outline'}>
          {role.isSystem ? t('roles.system') : t('roles.custom')}
        </Badge>
      </div>
    </div>
  );
}
