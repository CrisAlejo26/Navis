import { KeyRound, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconAction, type IconActionTone } from '@/components/ui/icon-action';

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
        { icon: Pencil, label: t('roles.editUser'), onClick: onEdit, tone: 'primary' },
        {
            icon: KeyRound,
            label: t('roles.changePassword'),
            onClick: onChangePassword,
            tone: 'warning',
        },
        { icon: Trash2, label: t('roles.deleteUser'), onClick: onDelete, tone: 'destructive' },
    ] satisfies { icon: typeof Pencil; label: string; onClick: () => void; tone: IconActionTone }[];

    return (
        <span className="gap-0.5 flex justify-end">
            {actions.map(({ icon: Icon, label, onClick, tone }) => (
                <IconAction
                    key={label}
                    tone={tone}
                    disabled={isSelf}
                    title={isSelf ? t('roles.ownRole') : label}
                    aria-label={label}
                    onClick={onClick}
                >
                    <Icon size={16} aria-hidden />
                </IconAction>
            ))}
        </span>
    );
}
