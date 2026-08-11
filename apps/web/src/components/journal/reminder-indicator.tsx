import { isEntryReminderDue } from '@navis/shared';
import { Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

/**
 * El aviso discreto de que hay recordatorio, en el listado y en la ficha
 * (§7.1, §7.5).
 *
 * Si ya venció y sigue sin atender, **respira**: reutiliza tal cual la
 * animación de la sonda de creyentes (`animate-latido`, RFC 0003 §7.3) y el
 * mismo escalonado por fila, para que varias alertas a la vez no lean como un
 * fallo (D14). El estado nunca es solo el color: lleva icono y texto (Regla 3
 * §7).
 */
export function ReminderIndicator({
  remindAt,
  remindDoneAt,
  index = 0,
  className,
}: {
  remindAt: string | null;
  remindDoneAt: string | null;
  index?: number;
  className?: string;
}) {
  const { t } = useTranslation();
  if (!remindAt) return null;

  const due = isEntryReminderDue({ remindAt, remindDoneAt });

  return (
    <span
      title={formatDateTime(remindAt)}
      style={due ? { animationDelay: `${String(Math.min(index, 12) * 120)}ms` } : undefined}
      className={cn(
        'gap-1 inline-flex items-center',
        due ? 'text-warning' : 'text-muted-foreground',
        className,
      )}
    >
      <Bell size={13} aria-hidden className={due ? 'animate-latido' : undefined} />
      <span className={cn('text-[11px]', due && 'animate-latido')}>
        {due ? t('journal.reminderField') : formatDateTime(remindAt)}
      </span>
    </span>
  );
}
