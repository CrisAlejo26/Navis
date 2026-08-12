import type { TagRef, TaskPriority } from '@navis/shared';
import { Bell, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { TagChip } from '@/components/tasks/tag-chip';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { PRIORITY_ACCENT, PRIORITY_LABEL_KEY } from '@/lib/tasks/task-format';
import { TASK_ICON_MAP } from '@/lib/tasks/icon-map';

export interface OccurrenceCardProps {
  title: string;
  time: string | null;
  tags: TagRef[];
  completed: boolean;
  /** Solo las tareas la llevan (D1). */
  priority?: TaskPriority;
  hasReminder?: boolean;
  onToggle: () => void;
  onOpen: () => void;
  isPending?: boolean;
  /** Retardo de entrada, para escalonar la lista (Regla 9 §5). */
  index?: number;
}

/**
 * La fila compacta de una tarea o un hábito (RFC 0018 §9.3): icono y color de
 * su primera etiqueta, hora si la tiene, y la prioridad como una franja
 * lateral **con la palabra escrita al lado** — el color nunca informa solo
 * (Regla 3 §7).
 */
export function OccurrenceCard({
  title,
  time,
  tags,
  completed,
  priority,
  hasReminder = false,
  onToggle,
  onOpen,
  isPending = false,
  index = 0,
}: OccurrenceCardProps) {
  const { t } = useTranslation();
  const first = tags[0];
  const Icon = first ? TASK_ICON_MAP[first.icon] : null;

  return (
    <li
      style={{ animationDelay: `${String(Math.min(index, 10) * 40)}ms` }}
      className="animate-rise-in"
    >
      <div
        className={cn(
          'gap-3 p-3 flex items-center rounded-xl border bg-card transition-opacity',
          priority && 'border-l-[3px]',
          completed && 'opacity-55',
        )}
        style={
          priority ? { borderLeftColor: `var(--color-${PRIORITY_ACCENT[priority]})` } : undefined
        }
      >
        {/* 44 px de objetivo táctil (Regla 5 §4). */}
        <button
          type="button"
          onClick={onToggle}
          disabled={isPending}
          aria-pressed={completed}
          aria-label={completed ? t('tasks.reopen') : t('tasks.complete')}
          className={cn(
            'h-11 w-11 flex shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-all',
            'ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            completed
              ? 'border-success bg-success text-success-foreground'
              : 'border-border hover:border-primary',
          )}
        >
          <Check
            size={18}
            aria-hidden
            className={cn(
              'transition-all duration-150',
              completed ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
            )}
          />
        </button>

        <button
          type="button"
          onClick={onOpen}
          className="gap-0.5 min-w-0 flex flex-1 cursor-pointer flex-col text-left"
        >
          <span className="gap-2 flex items-center">
            {first && Icon && (
              <span
                aria-hidden
                style={accentVars(first.accent)}
                className="h-6 w-6 flex shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--acento)_16%,transparent)] text-[var(--acento)]"
              >
                <Icon size={13} />
              </span>
            )}
            <span className={cn('text-sm font-medium truncate', completed && 'line-through')}>
              {title}
            </span>
          </span>

          <span className="gap-2 text-xs flex flex-wrap items-center text-muted-foreground">
            {time && <span className="tabular-nums">{time}</span>}
            {hasReminder && <Bell size={11} aria-hidden />}
            {priority && (
              <span
                className="font-medium"
                style={{ color: `var(--color-${PRIORITY_ACCENT[priority]})` }}
              >
                {t(PRIORITY_LABEL_KEY[priority])}
              </span>
            )}
            {tags.slice(0, 2).map((tag) => (
              <TagChip key={tag.id} tag={tag} size="sm" />
            ))}
          </span>
        </button>
      </div>
    </li>
  );
}
