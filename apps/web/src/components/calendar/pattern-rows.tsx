import { useDeletePattern } from '@navis/api-client';
import type { Congregation, MeetingPattern } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { accentStyles } from '@/lib/calendar/accents';
import { weekdayHeadings } from '@/lib/calendar/labels';
import { api } from '@/lib/api';
import { cn } from '@/lib/cn';

/** Lunes es 0 en la cabecera y domingo es 0 en el dato: se traduce una vez. */
function weekdayLabel(weekday: number): string {
  const headings = weekdayHeadings();
  return headings[(weekday + 6) % 7]?.label ?? '';
}

/**
 * Las reuniones fijas, agrupadas por sede. Borrar una **no borra** lo que ya se
 * programó a partir de ella: eso son decisiones tomadas (D7).
 */
export function PatternRows({
  patterns,
  congregations,
  onEdit,
}: {
  patterns: readonly MeetingPattern[];
  congregations: readonly Congregation[];
  onEdit: (pattern: MeetingPattern) => void;
}) {
  const { t } = useTranslation();
  const remove = useDeletePattern(api);
  const nameOf = (id: string) => congregations.find((one) => one.id === id)?.name ?? '';

  return (
    <ul className="divide-y">
      {patterns.map((pattern) => (
        <li key={pattern.id} className="gap-3 py-3 flex items-center">
          <span
            aria-hidden
            className={cn('h-8 w-1.5 shrink-0 rounded-full', accentStyles(pattern.accent).rail)}
          />

          <span className="min-w-0 flex-1">
            <span className="gap-2 flex items-baseline">
              <span className="font-medium truncate">{pattern.name}</span>
              {congregations.length > 1 && (
                <span className="text-xs text-muted-foreground">
                  {nameOf(pattern.congregationId)}
                </span>
              )}
            </span>
            <span className="text-xs block truncate text-muted-foreground">
              {weekdayLabel(pattern.weekday)} · {pattern.startTime.slice(0, 5)} ·{' '}
              {pattern.phases.map((phase) => phase.name).join(', ')}
            </span>
          </span>

          <button
            type="button"
            aria-label={t('common.edit')}
            onClick={() => {
              onEdit(pattern);
            }}
            className="h-9 w-9 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Pencil size={15} aria-hidden />
          </button>

          <button
            type="button"
            aria-label={t('common.delete')}
            onClick={() => {
              remove.mutate(pattern.id);
            }}
            className="h-9 w-9 inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Trash2 size={15} aria-hidden />
          </button>
        </li>
      ))}
    </ul>
  );
}
