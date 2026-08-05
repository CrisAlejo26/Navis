import type { ListStats } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { accentVars } from '@/lib/accents';

/**
 * **El solapamiento** (RFC 0010 D36).
 *
 * Es fácil llenar una pantalla de contadores. Esta es la cuenta que no se puede
 * hacer sin esta funcionalidad y que un pastor necesita de verdad: quien sale en
 * cinco listas se está quemando, y hoy eso no lo sabe nadie hasta que se cae.
 *
 * Cada nombre **lleva a su ficha** y cada lista a la suya: una cifra que no va a
 * ninguna parte es un adorno.
 */
export function OverlapRows({ overlap }: { overlap: ListStats['overlap'] }) {
  const { t } = useTranslation();

  if (overlap.inOtherLists.length === 0 && overlap.sharedWith.length === 0) return null;

  return (
    <div className="p-5 gap-4 flex flex-col rounded-xl border bg-card">
      <h3 className="text-sm font-semibold">{t('lists.overlap')}</h3>

      {overlap.inOtherLists.length > 0 && (
        <div className="gap-1.5 flex flex-col">
          <p className="text-xs text-muted-foreground">{t('lists.inSeveralLists')}</p>
          <ul className="gap-1 flex flex-col">
            {overlap.inOtherLists.map((one) => (
              <li
                key={one.believerId}
                className="gap-2 text-sm flex items-baseline justify-between"
              >
                <Link
                  to={`/believers/${one.believerId}`}
                  className="truncate underline-offset-4 hover:underline"
                >
                  {one.name}
                </Link>
                <span className="font-medium shrink-0 text-muted-foreground tabular-nums">
                  {t('lists.inNLists', { count: one.listCount })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {overlap.sharedWith.length > 0 && (
        <div className="gap-1.5 flex flex-col">
          <p className="text-xs text-muted-foreground">{t('lists.sharedWith')}</p>
          <ul className="gap-1.5 flex flex-wrap">
            {overlap.sharedWith.map((one) => (
              <li key={one.listId}>
                <span
                  style={accentVars(one.accent)}
                  className="h-7 gap-1.5 px-2.5 text-xs inline-flex items-center rounded-full bg-[var(--acento)]/12 text-foreground"
                >
                  <span aria-hidden className="size-2 rounded-full bg-[var(--acento)]" />
                  {one.name}
                  <span className="font-semibold tabular-nums">{one.count}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
