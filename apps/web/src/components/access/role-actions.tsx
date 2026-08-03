import type { RoleRow } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export interface RoleActionHandlers {
  onEdit: () => void;
  onDelete: () => void;
}

/**
 * Editar y borrar un rol. Los de serie no se borran, y ninguno mientras
 * alguna cuenta lo tenga puesto: el botón lo dice antes de intentarlo.
 */
export function RoleActions({ role, onEdit, onDelete }: RoleActionHandlers & { role: RoleRow }) {
  const { t } = useTranslation();
  const locked = role.isSystem || role.usersCount > 0;

  return (
    <span className="gap-0.5 flex justify-end">
      <Button variant="ghost" size="icon" aria-label={t('roles.editRole')} onClick={onEdit}>
        <Pencil size={16} aria-hidden />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        disabled={locked}
        title={role.isSystem ? t('roles.systemRoleLocked') : t('roles.roleInUse')}
        aria-label={t('roles.deleteRole')}
        onClick={onDelete}
        className="hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 size={16} aria-hidden />
      </Button>
    </span>
  );
}
