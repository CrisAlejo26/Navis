import { LayoutGrid, Table2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { useBelieversViewStore, type BelieversView } from '@/lib/believers/view';

const VIEWS = [
  { id: 'table', Icon: Table2, labelKey: 'believers.viewTable' },
  { id: 'cards', Icon: LayoutGrid, labelKey: 'believers.viewCards' },
] as const;

/**
 * Tabla o fichas.
 *
 * Solo sale de `md` para arriba, porque por debajo siempre son fichas
 * (RFC 0003 §7.4): un conmutador con una sola opción posible es mobiliario.
 */
export function BelieversViewSwitch() {
  const { t } = useTranslation();
  const view = useBelieversViewStore((state) => state.view);
  const setView = useBelieversViewStore((state) => state.setView);

  return (
    <div
      role="tablist"
      aria-label={t('believers.viewLabel')}
      className="p-0.5 gap-0.5 md:inline-flex hidden shrink-0 rounded-lg bg-muted"
    >
      {VIEWS.map(({ id, Icon, labelKey }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          aria-label={t(labelKey)}
          title={t(labelKey)}
          onClick={() => {
            setView(id satisfies BelieversView);
          }}
          className={cn(
            'h-9 w-9 inline-flex cursor-pointer items-center justify-center rounded-md',
            'transition-[background-color,color] duration-200',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            view === id
              ? 'shadow-sm bg-card text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon size={16} aria-hidden />
        </button>
      ))}
    </div>
  );
}
