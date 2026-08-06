import type { List } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { KeyRound } from 'lucide-react';

import { accentVars } from '@/lib/accents';
import { shareCardDescription } from '@/lib/lists/share-card';

/**
 * **La tarjeta tal y como la va a enseñar WhatsApp** (RFC 0010 §8.5).
 *
 * Se enseña antes de repartir el enlace porque es lo que va a ver medio grupo de
 * la iglesia, y porque en modo restringido **es otra**: el color, el nombre de
 * la iglesia y el de la lista, y ni un nombre ni el número de personas (D18).
 */
export function SharePreview({
  list,
  churchName,
  url,
}: {
  list: List;
  churchName: string;
  url: string;
}) {
  const { t } = useTranslation();
  const cerrada = list.visibility === 'restricted';

  return (
    <div className="gap-2 flex flex-col">
      <p className="text-xs font-medium text-muted-foreground">{t('lists.previewTitle')}</p>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div
          style={accentVars(list.accent)}
          className="px-4 py-6 gap-2 min-h-28 flex flex-col justify-center bg-[var(--acento)] text-[var(--acento-fg)]"
        >
          <p className="font-semibold text-[10px] tracking-[0.2em] uppercase opacity-80">
            {churchName}
          </p>
          <p className="text-xl font-semibold tracking-[-0.02em]">{list.name}</p>
          {cerrada && (
            <p className="gap-1.5 text-xs flex items-center opacity-85">
              <KeyRound size={12} aria-hidden />
              {t('lists.lockedCover')}
            </p>
          )}
        </div>

        <div className="p-3">
          <p className="text-sm font-medium truncate">
            {list.name} · {churchName}
          </p>
          <p className="mt-0.5 text-xs line-clamp-2 text-muted-foreground">
            {shareCardDescription(list, t)}
          </p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">{url}</p>
        </div>
      </div>

      {cerrada && <p className="text-xs text-muted-foreground">{t('lists.previewNoNames')}</p>}
    </div>
  );
}
