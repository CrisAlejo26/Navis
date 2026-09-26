import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { IconAction, type IconActionTone } from '@/components/ui/icon-action';

export interface EntryActionHandlers {
    onEdit: () => void;
    onDelete: () => void;
}

/** Lo que se le puede hacer a una entrada desde el listado (§7.5). */
export function EntryActions({
    title,
    onEdit,
    onDelete,
}: EntryActionHandlers & { title?: string }) {
    const { t } = useTranslation();

    const actions = [
        { icon: Pencil, label: t('journal.edit'), onClick: onEdit, tone: 'primary' },
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
