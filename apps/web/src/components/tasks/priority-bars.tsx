import type { TaskStatsByPriority } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { PRIORITY_ACCENT, PRIORITY_LABEL_KEY } from '@/lib/tasks/task-format';

/** Cuántas tareas de cada prioridad, en barras horizontales (§9.4). */
export function PriorityBars({ data }: { data: TaskStatsByPriority[] }) {
  const { t } = useTranslation();
  const max = Math.max(...data.map((row) => row.count), 1);

  return (
    <ul className="gap-2.5 flex flex-col">
      {data.map((row) => (
        <li key={row.priority} className="gap-2 text-sm flex items-center">
          <span className="w-14 font-medium shrink-0">{t(PRIORITY_LABEL_KEY[row.priority])}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <span
              className="animate-track-in block h-full origin-left rounded-full"
              style={{
                transform: `scaleX(${String(row.count / max)})`,
                background: `var(--color-${PRIORITY_ACCENT[row.priority]})`,
              }}
            />
          </span>
          <span className="w-6 shrink-0 text-right text-muted-foreground tabular-nums">
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
