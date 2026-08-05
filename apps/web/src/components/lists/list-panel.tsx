import type { ListSummary } from '@navis/shared';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { MiniWake } from '@/components/lists/mini-wake';
import { VisibilityBadge } from '@/components/lists/visibility-badge';
import { accentVars } from '@/lib/accents';
import { formatNumber } from '@/lib/format';

/**
 * Un panel del **tablón** (RFC 0010 §8.2, D38).
 *
 * La pregunta que responde la portada no es «cuántas listas hay», es «qué hay
 * puesto en la puerta ahora mismo». De ahí sale la forma: el panel **es** el
 * color de la lista, relleno, no una tarjeta blanca con un puntito. Doce listas
 * son doce colores, y eso es exactamente lo que la sección debe parecer.
 */
export function ListPanel({ list, delay }: { list: ListSummary; delay: number }) {
  const { t } = useTranslation();

  return (
    <Link
      to={`/lists/${list.slug}`}
      style={{ ...accentVars(list.accent), animationDelay: `${String(delay)}ms` }}
      className="p-5 gap-4 animate-rise-in group min-h-44 rounded-2xl hover:-translate-y-0.5 relative flex flex-col justify-between overflow-hidden bg-[var(--acento)] text-[var(--acento-fg)] transition-transform duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="gap-3 flex items-start justify-between">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold truncate tracking-[-0.02em]">{list.name}</h2>
          {list.description && (
            <p className="mt-1 text-sm line-clamp-2 opacity-80">{list.description}</p>
          )}
        </div>
        <VisibilityBadge visibility={list.visibility} onPanel />
      </div>

      <div className="gap-3 flex items-end justify-between">
        <div>
          <p className="text-3xl font-semibold leading-none tabular-nums">
            {formatNumber(list.memberCount)}
          </p>
          <p className="mt-1 text-xs opacity-80">
            {t('lists.people', { count: list.memberCount })}
          </p>
        </div>

        {/* Se reconoce la lista por su gente antes de leer el nombre (§8.2). */}
        <ul className="flex">
          {list.initials.map((initials, index) => (
            <li
              key={`${initials}-${String(index)}`}
              className="h-7 w-7 -ml-2 font-semibold first:ml-0 inline-flex items-center justify-center rounded-full border border-[var(--acento)] bg-[var(--acento-fg)]/20 text-[10px] backdrop-blur-[1px]"
            >
              {initials}
            </li>
          ))}
        </ul>
      </div>

      {list.visibility !== 'private' && <MiniWake views={list.recentViews} />}
    </Link>
  );
}
