import { useTranslation } from 'react-i18next';
import { isTaskOverdue, todayIn } from '@navis/shared';
import { Badge } from '@/components/ui/badge';
import { formatDay } from '@/lib/format';
import type { ActivityItem } from '@/lib/tasks/filters';

/**
 * «Vence el …» o «Vencida · …» (Fase 7a). El color no informa solo: la palabra
 * «Vencida» va escrita. Solo las tareas que no se repiten tienen límite.
 */
export function TaskLimitBadge({ item }: { item: ActivityItem }) {
    const { t } = useTranslation();
    if (!('dueDate' in item) || !item.dueDate) return null;
    const overdue = isTaskOverdue(
        { dueDate: item.dueDate, status: item.status },
        todayIn(Intl.DateTimeFormat().resolvedOptions().timeZone),
    );
    const day = formatDay(item.dueDate);
    return (
        <Badge
            icon="flag-outline"
            tone={overdue ? 'destructive' : 'muted'}
            label={overdue ? `${t('tasks.overdue')} · ${day}` : t('tasks.dueOn', { date: day })}
        />
    );
}
