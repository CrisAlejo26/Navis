import { BookOpen, Compass, LayoutGrid, Route } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { cn } from '@/lib/cn';
import { useDreamDetailViewStore, type DreamDetailView } from '@/lib/dreams/detail-view';

/** Las cuatro vistas de la ficha. Ninguna se lee como una cruz (Regla 7 §6). */
const VIEWS = [
  { id: 'completo', Icon: LayoutGrid, labelKey: 'dreams.detailViews.completo' },
  { id: 'lectura', Icon: BookOpen, labelKey: 'dreams.detailViews.lectura' },
  { id: 'interpretacion', Icon: Compass, labelKey: 'dreams.detailViews.interpretacion' },
  { id: 'recorrido', Icon: Route, labelKey: 'dreams.detailViews.recorrido' },
] as const;

/**
 * El conmutador de la ficha (RFC 0005 §7.6).
 *
 * Lleva el icono **y el nombre** de `sm` para arriba: cuatro iconos sueltos no
 * se distinguen sin pulsarlos, y aquí no son cuatro variantes de lo mismo —cada
 * una responde a una pregunta distinta—.
 */
export function DreamViewSwitch() {
  const { t } = useTranslation();
  const view = useDreamDetailViewStore((state) => state.view);
  const setView = useDreamDetailViewStore((state) => state.setView);

  return (
    <div
      role="tablist"
      aria-label={t('dreams.viewLabel')}
      className="p-0.5 gap-0.5 inline-flex shrink-0 rounded-lg bg-muted"
    >
      {VIEWS.map(({ id, Icon, labelKey }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={view === id}
          title={t(labelKey)}
          onClick={() => {
            setView(id satisfies DreamDetailView);
          }}
          className={cn(
            'h-8 gap-1.5 px-2.5 text-xs font-medium inline-flex cursor-pointer items-center rounded-md',
            'transition-[background-color,color] duration-200',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
            view === id
              ? 'shadow-sm bg-card text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon size={14} aria-hidden />
          <span className="sm:inline hidden">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
