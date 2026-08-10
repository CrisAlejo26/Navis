import type { Church } from '@navis/shared';
import { Check, Pencil, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { ChurchBadge } from '@/components/church-badge';

/**
 * La lista de iglesias accesibles, con una marca en la activa y, si se pueden
 * crear, la entrada para añadir otra.
 *
 * Va aparte del selector porque el selector ya tiene bastante con su estado;
 * esto solo pinta y avisa (Regla 6).
 */
export function ChurchMenu({
  items,
  activeId,
  canCreate,
  onSelect,
  onCreate,
  onEdit,
}: {
  items: Church[];
  activeId: string | null;
  canCreate: boolean;
  onSelect: (churchId: string) => void;
  onCreate: () => void;
  onEdit: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="left-0 mt-2 w-64 p-2 shadow-lg absolute top-full z-40 origin-top-left rounded-xl border bg-card">
      <p className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{t('church.switch')}</p>

      <ul role="menu" className="max-h-72 flex flex-col overflow-y-auto">
        {items.map((church) => (
          <li key={church.id} role="none">
            <button
              type="button"
              role="menuitemradio"
              aria-checked={church.id === activeId}
              onClick={() => {
                onSelect(church.id);
              }}
              className="gap-2 px-2 py-2 text-sm flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-muted"
            >
              <ChurchBadge id={church.id} name={church.name} muted={church.id !== activeId} />
              <span className="min-w-0 flex-1 truncate text-left">{church.name}</span>
              {church.id === activeId && (
                <Check size={16} aria-hidden className="shrink-0 text-primary" />
              )}
            </button>
          </li>
        ))}
      </ul>

      {canCreate && (
        <>
          <hr className="my-1.5 border-border" />
          <button
            type="button"
            onClick={onEdit}
            className="gap-2 px-2 py-2 text-sm flex w-full cursor-pointer items-center rounded-lg transition-colors hover:bg-muted"
          >
            <Pencil size={16} aria-hidden className="shrink-0 text-muted-foreground" />
            {t('church.edit')}
          </button>
          <hr className="my-1.5 border-border" />
          <button
            type="button"
            onClick={onCreate}
            className="gap-2 px-2 py-2 text-sm font-medium flex w-full cursor-pointer items-center rounded-lg text-primary transition-colors hover:bg-primary/10"
          >
            <Plus size={16} aria-hidden className="shrink-0" />
            {t('church.add')}
          </button>
        </>
      )}
    </div>
  );
}
