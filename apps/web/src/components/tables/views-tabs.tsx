import type { CustomTableView } from '@navis/shared';
import { LayoutGrid, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Tabs, type TabItem } from '@/components/ui/tabs';
import { GRID_VIEW } from '@/lib/tables/use-active-view';
import { VIEW_TYPE_ICON } from '@/lib/tables/view-types';

/**
 * Las pestañas de vista de una tabla (RFC 0021 D24): la de cuadrícula, que
 * siempre existe y no se puede borrar, y las guardadas — tablero y calendario.
 */
export function ViewsTabs({
  views,
  activeId,
  editable,
  onChange,
  onAdd,
  onDelete,
}: {
  views: readonly CustomTableView[];
  activeId: string;
  editable: boolean;
  onChange: (id: string) => void;
  onAdd: () => void;
  onDelete: (view: CustomTableView) => void;
}) {
  const { t } = useTranslation();

  const items: TabItem<string>[] = [
    { value: GRID_VIEW, label: t('tables.view.grid'), icon: LayoutGrid },
    ...views.map((view) => ({
      value: view.id,
      label: view.name,
      icon: VIEW_TYPE_ICON[view.type],
    })),
  ];
  const active = views.find((one) => one.id === activeId);

  return (
    <div className="gap-2 flex items-center justify-between">
      <Tabs items={items} value={activeId} onChange={onChange} label={t('tables.title')} />

      {editable && (
        <div className="gap-1 flex shrink-0 items-center">
          {active && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('tables.deleteView')}
              onClick={() => {
                onDelete(active);
              }}
            >
              <Trash2 size={15} aria-hidden />
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onAdd}>
            <Plus size={15} aria-hidden />
            {t('tables.newView')}
          </Button>
        </div>
      )}
    </div>
  );
}
