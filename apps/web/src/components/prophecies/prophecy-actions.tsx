import { Anchor, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconAction, type IconActionTone } from '@/components/ui/icon-action';

export interface ProphecyActionHandlers {
    onEdit: () => void;
    onFulfill: () => void;
    onDelete: () => void;
}

/**
 * Lo que se le puede hacer a una profecía desde el listado. Lo comparten la
 * fila de la tabla y la ficha, que son la misma acción en dos sitios (§7.5).
 *
 * «Anotar un cumplimiento» va primero porque es lo que más se pulsa: una
 * profecía se escribe una vez y se va cumpliendo durante años.
 */
export function ProphecyActions({
    title,
    onEdit,
    onFulfill,
    onDelete,
}: ProphecyActionHandlers & { title?: string }) {
    const { t } = useTranslation();

    const actions = [
        {
            icon: Anchor,
            label: t('prophecies.addFulfillment'),
            onClick: onFulfill,
            tone: 'success',
        },
        { icon: Pencil, label: t('prophecies.edit'), onClick: onEdit, tone: 'primary' },
        { icon: Trash2, label: t('common.delete'), onClick: onDelete, tone: 'destructive' },
    ] satisfies {
        icon: typeof Trash2;
        label: string;
        onClick: () => void;
        tone: IconActionTone;
    }[];

    return (
        <span className="gap-0.5 flex justify-end">
            {actions.map(({ icon: Icon, label, onClick, tone }) => (
                <IconAction
                    key={label}
                    tone={tone}
                    title={label}
                    aria-label={title ? `${label}: ${title}` : label}
                    onClick={onClick}
                >
                    <Icon size={16} aria-hidden />
                </IconAction>
            ))}
        </span>
    );
}
