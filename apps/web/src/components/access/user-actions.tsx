import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

export interface UserActionHandlers {
  onEdit: () => void;
  onChangePassword: () => void;
  onDelete: () => void;
}

/**
 * Las tres cosas que se le pueden hacer a una cuenta ajena. Las usan la fila
 * de la tabla y la ficha de móvil, que son la misma acción en dos sitios.
 *
 * Sobre la propia van deshabilitadas: cada cual se edita desde su perfil.
 */
export function UserActions({
  isSelf,
  onEdit,
  onChangePassword,
  onDelete,
}: UserActionHandlers & { isSelf: boolean }) {
  const { t } = useTranslation();

  const actions = [
    { icon: Pencil, label: t('roles.editUser'), onClick: onEdit, danger: false },
    { icon: KeyRound, label: t('roles.changePassword'), onClick: onChangePassword, danger: false },
    { icon: Trash2, label: t('roles.deleteUser'), onClick: onDelete, danger: true },
  ] as const;

  return (
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
  );
}
