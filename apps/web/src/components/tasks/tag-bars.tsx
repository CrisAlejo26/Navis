import type { TaskStatsByTag } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { accentVars } from '@/lib/accents';
import { TASK_ICON_MAP } from '@/lib/tasks/icon-map';

/** Cuántas tareas lleva cada etiqueta, coloreadas con su propio acento (§9.4). */
export function TagBars({ data }: { data: TaskStatsByTag[] }) {
  const { t } = useTranslation();
  const top = data.slice(0, 8);
  const max = Math.max(...top.map((row) => row.count), 1);

  if (top.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('tasks.noTasks')}</p>;
  }

  return (
    <ul className="gap-2.5 flex flex-col">
      {top.map((row) => {
        const Icon = TASK_ICON_MAP[row.icon];

        return (
          <li
            key={row.tagId}
            style={accentVars(row.accent)}
            className="gap-2 text-sm flex items-center"
          >
            <span className="gap-1.5 w-28 font-medium flex shrink-0 items-center truncate text-[var(--acento)]">
              {Icon && <Icon size={13} aria-hidden />}
              <span className="truncate">{row.name}</span>
            </span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <span
                className="animate-track-in block h-full origin-left rounded-full bg-[var(--acento)]"
                style={{ transform: `scaleX(${String(row.count / max)})` }}
              />
            </span>
            <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">
              {row.count}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
