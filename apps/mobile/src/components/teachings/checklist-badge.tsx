import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';

/**
 * La cuenta de una checklist con su color (RFC 0022 §3): ámbar mientras queda
 * algo sin marcar, verde cuando está completa. Va con icono y número, nunca
 * solo color (Regla 3 §7). Sin checklist no se pinta nada.
 */
export function ChecklistBadge({
    checklist,
}: {
    checklist: { checked: number; total: number } | null;
}) {
    const { t } = useTranslation();
    if (!checklist) return null;

    const done = checklist.checked === checklist.total;
    return (
        <Badge
            tone={done ? 'success' : 'warning'}
            icon={done ? 'checkmark-done-outline' : 'checkbox-outline'}
            label={t('teachings.stats.checklistValue', {
                checked: checklist.checked,
                total: checklist.total,
            })}
        />
    );
}
