import type { ListStats } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { BelieverPhoto } from '@/components/believers/believer-photo';
import { formatDateTime } from '@/lib/format';

/**
 * **Quién ha entrado** (RFC 0010 D35).
 *
 * Cuando la lista es restringida, la ficha deja de decir «14 visitas de 9
 * personas» y pasa a decir «Juan Pérez, ayer a las 21:14 · 12 entradas», con su
 * foto si el acceso está enlazado a un creyente. Es la respuesta buena a la
 * pregunta del principio, y llega sin guardar una sola dirección IP entera.
 */
export function ViewerRowsStats({ viewers }: { viewers: ListStats['audience']['byViewer'] }) {
  const { t } = useTranslation();

  if (viewers.length === 0) {
    return (
      <div className="p-5 rounded-xl border bg-card">
        <h3 className="text-sm font-semibold">{t('lists.whoEntered')}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('lists.viewsEmpty')}</p>
      </div>
    );
  }

  return (
    <div className="p-5 gap-3 flex flex-col rounded-xl border bg-card">
      <h3 className="text-sm font-semibold">{t('lists.whoEntered')}</h3>

      <ul className="gap-2 flex flex-col">
        {viewers.map((viewer) => (
          <li key={viewer.viewerId} className="gap-3 flex items-center">
            {viewer.believerId && (
              <BelieverPhoto
                believer={{ id: viewer.believerId, hasPhoto: viewer.believerHasPhoto }}
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{viewer.label}</p>
              <p className="text-xs text-muted-foreground">{formatDateTime(viewer.lastAt)}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums">
              {t('lists.entries', { count: viewer.views })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
