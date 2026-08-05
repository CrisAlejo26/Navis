import type { ListSummary, ListViewer } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';

/**
 * Una fila del **directorio de accesos** (RFC 0010 §8.5).
 *
 * Es la misma información girada: aquí se contesta «¿a qué llega Juan?» sin
 * recorrer siete listas, con una **pastilla por lista en el color de cada una**.
 */
export function ViewerDirectoryRow({
  viewer,
  lists,
  onOpen,
}: {
  viewer: ListViewer;
  lists: readonly ListSummary[];
  onOpen: () => void;
}) {
  const { t } = useTranslation();
  const suyas = lists.filter((one) => viewer.listIds.includes(one.id));

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'px-3 py-3 gap-3 flex w-full cursor-pointer items-center text-left',
          'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
          !viewer.isActive && 'opacity-55',
        )}
      >
        {viewer.believerId && (
          <BelieverPhoto believer={{ id: viewer.believerId, hasPhoto: viewer.believerHasPhoto }} />
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{viewer.label}</p>
          <p className="text-xs text-muted-foreground">
            {viewer.username}
            {' · '}
            {viewer.lastSeenAt ? formatDateTime(viewer.lastSeenAt) : t('lists.neverEnteredShort')}
            {!viewer.isActive && ` · ${t('lists.inactive')}`}
          </p>
        </div>

        <ul className="gap-1 flex max-w-[45%] flex-wrap justify-end">
          {suyas.map((list) => (
            <li key={list.id}>
              <span
                style={accentVars(list.accent)}
                className="h-6 gap-1.5 px-2 inline-flex items-center rounded-full bg-[var(--acento)]/14 text-[11px]"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-[var(--acento)]" />
                {list.name}
              </span>
            </li>
          ))}
          {suyas.length === 0 && (
            <li className="text-[11px] text-muted-foreground">{t('lists.noLists')}</li>
          )}
        </ul>
      </button>
    </li>
  );
}
