import { believerName } from '@navis/shared';
import { Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { BelieverActions } from '@/components/believers/believer-actions';
import type { BelieverCells } from '@/components/believers/believer-row';
import { GiftTags } from '@/components/believers/gift-tags';
import { Sonda } from '@/components/believers/sonda';
import { StatusBadge } from '@/components/believers/status-badge';
import { accentVars } from '@/lib/accents';
import { cn } from '@/lib/cn';

/**
 * El mismo dato como ficha: es lo que se ve por debajo de `md` y en la vista de
 * fichas (§7.4).
 *
 * **La sonda va al pie y a todo lo ancho**, que es donde mejor se lee: ahí sí
 * hay sitio para la frase entera y no compite con el nombre.
 */
export function BelieverCard({
  believer,
  congregation,
  today,
  canManage,
  index,
  selected,
  onToggleSelected,
  ...actions
}: BelieverCells) {
  const { t } = useTranslation();
  const name = believerName(believer);

  return (
    <article
      className={cn(
        'gap-3 p-4 flex h-full flex-col rounded-xl border bg-card',
        // El filete rojo es lo que se ve cuando la animación está apagada
        // (§7.3): quien ha agotado su margen se distingue sin depender del
        // color de la sonda ni de su latido.
        believer.needsAttention && 'border-l-2 border-l-destructive',
      )}
    >
      <div className="gap-2 flex items-start justify-between">
        <div className="gap-2.5 min-w-0 flex items-start">
          {canManage && (
            <input
              type="checkbox"
              checked={selected}
              aria-label={t('believers.selectOne', { name })}
              onChange={onToggleSelected}
              className="mt-1 h-4 w-4 rounded shrink-0 cursor-pointer accent-primary focus-visible:ring-2 focus-visible:ring-ring"
            />
          )}

          <div className="min-w-0">
            <Link
              to={`/believers/${believer.id}`}
              className="font-medium rounded-sm text-[15px] hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              {name}
            </Link>

            <div className="gap-x-3 gap-y-1 mt-1 text-xs flex flex-wrap items-center text-muted-foreground">
              {congregation && (
                <span className="gap-1.5 inline-flex items-center">
                  <span
                    aria-hidden
                    style={accentVars(congregation.accent)}
                    className="h-1.5 w-1.5 rounded-full bg-[var(--acento)]"
                  />
                  {congregation.name}
                </span>
              )}

              {believer.phone && (
                <a
                  href={`tel:${believer.phone}`}
                  aria-label={t('believers.callPhone', { name })}
                  className="gap-1 inline-flex items-center rounded-sm tabular-nums hover:text-foreground"
                >
                  <Phone size={12} aria-hidden />
                  {believer.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        <StatusBadge status={believer.status} />
      </div>

      <GiftTags gifts={believer.gifts} max={4} />

      <div className="pt-1 mt-auto">
        <Sonda believer={believer} today={today} variant="block" index={index} />
      </div>

      {canManage && (
        <div className="-mb-2 -mr-2">
          <BelieverActions name={name} canManage={canManage} {...actions} />
        </div>
      )}
    </article>
  );
}
