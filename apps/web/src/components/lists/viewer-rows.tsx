import { useSetListViewers } from '@navis/api-client';
import type { ListViewer } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

/**
 * **Quién puede ver esta lista** (RFC 0010 §8.5).
 *
 * La lista de accesos de la iglesia con su casilla: marcado, ese acceso abre
 * esta lista. Cada fila dice **a cuántas listas más llega** y cuándo entró por
 * última vez, que es lo que hace falta para decidir sin abrir el directorio.
 */
export function ViewerRows({
  listId,
  viewers,
  disabled,
}: {
  listId: string;
  viewers: readonly ListViewer[];
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const setViewers = useSetListViewers(api);

  if (viewers.length === 0) {
    return <p className="text-sm text-muted-foreground">{t('lists.noViewers')}</p>;
  }

  const concedidos = viewers.filter((one) => one.listIds.includes(listId)).map((one) => one.id);

  const alternar = (id: string, checked: boolean) => {
    setViewers.mutate({
      listId,
      ids: checked ? [...concedidos, id] : concedidos.filter((one) => one !== id),
    });
  };

  return (
    <ul className="divide-y rounded-lg border">
      {viewers.map((viewer) => (
        <li key={viewer.id} className="px-3 py-2 gap-3 flex items-center">
          {viewer.believerId && (
            <BelieverPhoto
              believer={{ id: viewer.believerId, hasPhoto: viewer.believerHasPhoto }}
            />
          )}

          <div className="min-w-0 flex-1">
            <Checkbox
              disabled={disabled ?? !viewer.isActive}
              checked={viewer.listIds.includes(listId)}
              label={viewer.label}
              onChange={(event) => {
                alternar(viewer.id, event.target.checked);
              }}
            />
            <p className="pl-6.5 text-xs text-muted-foreground">
              {viewer.username} · {t('lists.reachesLists', { count: viewer.listIds.length })}
              {viewer.lastSeenAt
                ? ` · ${formatDateTime(viewer.lastSeenAt)}`
                : ` · ${t('lists.neverEnteredShort')}`}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
