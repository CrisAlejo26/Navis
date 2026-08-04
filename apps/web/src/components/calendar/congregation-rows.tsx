import { useDeleteCongregation } from '@navis/api-client';
import type { Congregation } from '@navis/shared';
import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { accentStyles } from '@/lib/calendar/accents';
import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/cn';

/**
 * Las sedes de la iglesia. La última no se puede borrar: sin sede no se puede
 * programar nada, así que el servidor lo impide y aquí ni se ofrece.
 */
export function CongregationRows({ congregations }: { congregations: readonly Congregation[] }) {
  const { t } = useTranslation();
  const remove = useDeleteCongregation(api);

  return (
    <ul className="divide-y">
      {congregations.map((congregation) => (
        <li key={congregation.id} className="gap-3 py-3 flex items-center">
          <span
            aria-hidden
            className={cn(
              'h-8 w-1.5 shrink-0 rounded-full',
              accentStyles(congregation.accent).rail,
            )}
          />

          <span className="min-w-0 flex-1">
            <span className="font-medium block truncate">{congregation.name}</span>
            {congregation.city && (
              <span className="text-xs block truncate text-muted-foreground">
                {congregation.city}
              </span>
            )}
          </span>

          {congregations.length > 1 && (
            <button
              type="button"
              aria-label={t('common.delete')}
              onClick={() => {
                remove.mutate(congregation.id, {
                  onError: () => {
                    toast.error(t('calendar.lastCongregation'));
                  },
                });
              }}
              className="h-9 w-9 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Trash2 size={15} aria-hidden />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
