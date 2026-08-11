import { isEntryReminderDue } from '@navis/shared';
import { Bell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

/**
 * El recordatorio, con su mensaje, su fecha y el botón para darlo por
 * atendido (§7.7). Si venció y sigue pendiente, respira (D14).
 */
export function ReminderCard({
  remindAt,
  remindText,
  remindDoneAt,
  isMarking,
  onMarkDone,
}: {
  remindAt: string;
  remindText: string | null;
  remindDoneAt: string | null;
  isMarking: boolean;
  onMarkDone: () => void;
}) {
  const { t } = useTranslation();
  const due = isEntryReminderDue({ remindAt, remindDoneAt });

  return (
    <div
      style={due ? { animationDelay: '80ms' } : undefined}
      className="gap-3 p-4 animate-rise-in flex flex-col rounded-xl border border-warning/30 bg-warning/5"
    >
      <p
        className={cn('gap-2 text-sm font-medium inline-flex items-center', due && 'text-warning')}
      >
        <Bell size={15} aria-hidden className={due ? 'animate-latido' : undefined} />
        {remindDoneAt ? t('journal.reminderAttended') : t('journal.reminderPending')}
      </p>

      {remindText && <p className="text-sm">{remindText}</p>}
      <p className="text-xs text-muted-foreground tabular-nums">{formatDateTime(remindAt)}</p>

      {!remindDoneAt && (
        <Button variant="secondary" size="md" isLoading={isMarking} onClick={onMarkDone}>
          <Check size={15} aria-hidden />
          {t('journal.reminderDone')}
        </Button>
      )}
    </div>
  );
}
