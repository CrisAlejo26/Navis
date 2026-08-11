import { JOURNAL_WINDOWS, type JournalStats, type JournalWindow } from '@navis/shared';
import { Bell } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Chip } from '@/components/ui/chip';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { ENTRY_KIND_ORDER, ENTRY_KIND_STYLES } from '@/lib/journal/entry-kind';
import type { JournalFilters as Filters } from '@/lib/journal/filters';
import { formatNumber } from '@/lib/format';

/** La clave de traducción de cada ventana. Nada de claves construidas (Regla 2 §3). */
const WINDOW_LABEL = {
  '7d': 'journal.windows.recent',
  '30d': 'journal.windows.month',
  year: 'journal.windows.year',
  all: 'journal.windows.all',
} as const satisfies Record<JournalWindow, string>;

function Grupo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="gap-2 min-w-0 flex flex-col">
      <span className="font-medium tracking-wide text-[11px] text-muted-foreground uppercase">
        {label}
      </span>
      <div className="gap-1.5 flex flex-wrap" role="group" aria-label={label}>
        {children}
      </div>
    </div>
  );
}

/** Una pastilla de tipo, **en su propio color** (D15), a diferencia del `Chip` de tono fijo. */
function KindChip({
  active,
  accent,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean; accent: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      style={accentVars(accent)}
      className={cn(
        'h-8 gap-1.5 px-3 text-xs font-medium inline-flex cursor-pointer items-center rounded-full border',
        'transition-[background-color,border-color,color] duration-200',
        'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active
          ? 'border-[var(--acento)]/40 bg-[var(--acento)]/15 text-[var(--acento)]'
          : 'border-transparent bg-muted text-muted-foreground hover:text-foreground',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Tipo, ventana de tiempo y recordatorios pendientes, **agrupados y
 * rotulados** (RFC 0017 §7.4).
 *
 * Las siete pastillas de tipo llevan su cuenta dentro y cada una en su color
 * (D15): la métrica es la navegación, no un panel de indicadores aparte.
 *
 * En escritorio los grupos van en línea, separados por un filete; en
 * pantallas estrechas se apilan.
 */
export function JournalFilters({
  filters,
  stats,
}: {
  filters: Filters;
  stats: JournalStats | undefined;
}) {
  const { t } = useTranslation();

  return (
    <div className="gap-4 lg:gap-6 lg:flex-row lg:items-start flex flex-col">
      <Grupo label={t('journal.kindField')}>
        {ENTRY_KIND_ORDER.map((kind) => {
          const { Icon, accent, labelKey } = ENTRY_KIND_STYLES[kind];
          const total = stats?.byKind[kind];

          return (
            <KindChip
              key={kind}
              active={filters.kind.includes(kind)}
              accent={accent}
              onClick={() => {
                filters.toggleKind(kind);
              }}
            >
              <Icon size={13} aria-hidden />
              {t(labelKey)}
              {total !== undefined && (
                <span className="tabular-nums opacity-75">{formatNumber(total)}</span>
              )}
            </KindChip>
          );
        })}
      </Grupo>

      <span aria-hidden className="lg:block hidden w-px self-stretch bg-border" />

      <Grupo label={t('journal.occurredAtField')}>
        {JOURNAL_WINDOWS.map((window) => (
          <Chip
            key={window}
            // Con un tramo a medida puesto, ninguna ventana rápida está activa:
            // decir «Todo» mientras se filtra por dos semanas sería mentir.
            active={!filters.from && !filters.to && filters.window === window}
            onClick={() => {
              filters.setWindow(window);
            }}
          >
            {t(WINDOW_LABEL[window])}
          </Chip>
        ))}
      </Grupo>

      <span aria-hidden className="lg:block hidden w-px self-stretch bg-border" />

      <Grupo label={t('journal.reminderField')}>
        <Chip
          tone="warning"
          active={filters.pendingReminder}
          onClick={() => {
            filters.setPendingReminder(!filters.pendingReminder);
          }}
        >
          <Bell size={13} aria-hidden />
          {t('journal.pendingReminderChip')}
          {stats && (
            <span className="tabular-nums opacity-75">{formatNumber(stats.pendingReminders)}</span>
          )}
        </Chip>
      </Grupo>
    </div>
  );
}
