import { useDeletePattern } from '@navis/api-client';
import type { Congregation, MeetingPattern } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
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
 * Las reuniones fijas, **agrupadas por sede**: cada una tiene su semana, y en
 * Elda la alabanza puede caer otro día que en Benidorm (RFC 0002 §5.7).
 *
 * Borrar una **no borra** lo que ya se programó a partir de ella: eso son
 * decisiones tomadas (D7).
 */
export function PatternRows({
  patterns,
  congregations,
  calendarId,
  onEdit,
}: {
  patterns: readonly MeetingPattern[];
  congregations: readonly Congregation[];
  calendarId: string;
  onEdit: (pattern: MeetingPattern) => void;
}) {
  const { t } = useTranslation();
  const remove = useDeletePattern(api, calendarId);
  const varias = congregations.length > 1;

  return (
    <div className="gap-5 flex flex-col">
      {congregations.map((congregation) => {
        const suyas = patterns.filter((one) => one.congregationId === congregation.id);
        if (suyas.length === 0) return null;

        return (
          <section key={congregation.id}>
            {varias && (
              <h3
                className={cn(
                  'mb-1 font-semibold text-[11px] tracking-[0.14em] uppercase',
                  accentStyles(congregation.accent).text,
                )}
              >
                {congregation.name}
              </h3>
            )}

            <ul className="divide-y">
              {suyas.map((pattern) => (
                <li key={pattern.id} className="gap-3 py-3 flex items-center">
                  <span
                    aria-hidden
                    className={cn(
                      'h-8 w-1.5 shrink-0 rounded-full',
                      accentStyles(pattern.accent).rail,
                    )}
                  />

                  <span className="min-w-0 flex-1">
                    <span className="gap-2 flex items-baseline">
                      <span className="font-medium truncate">{pattern.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {weekdayLabel(pattern.weekday)} · {pattern.startTime.slice(0, 5)}
                      </span>
                    </span>
                    <span className="text-xs block truncate text-muted-foreground">
                      {pattern.phases.map((phase) => phase.name).join(' · ')}
                    </span>
                  </span>

                  <Button
                    aria-label={`${t('common.edit')}: ${pattern.name}`}
                    onClick={() => {
                      onEdit(pattern);
                    }}
                    variant="ghost"
                    size="icon"
                  >
                    <Pencil size={15} aria-hidden />
                  </Button>

                  <Button
                    aria-label={`${t('common.delete')}: ${pattern.name}`}
                    onClick={() => {
                      remove.mutate(pattern.id);
                    }}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 size={15} aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
