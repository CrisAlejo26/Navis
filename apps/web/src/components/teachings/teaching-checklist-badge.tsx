import { ListChecks } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';

/**
 * La cuenta de una checklist, con su color (RFC 0022 §3): ámbar mientras
 * queda algo sin marcar, verde cuando está completa. Es la pista que
 * distingue la fila de esta sección de las de profecías o el cuaderno.
 */
export function TeachingChecklistBadge({
  checklist,
}: {
  checklist: { checked: number; total: number } | null;
}) {
  const { t } = useTranslation();
  if (!checklist) return <span className="text-muted-foreground">—</span>;

  const done = checklist.checked === checklist.total;

  return (
    <span
      className={cn(
        'gap-1 px-2 py-0.5 text-xs font-medium inline-flex items-center rounded-full tabular-nums',
        done ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning',
      )}
    >
      <ListChecks size={12} aria-hidden />
      {t('teachings.stats.checklistValue', { checked: checklist.checked, total: checklist.total })}
    </span>
  );
}
