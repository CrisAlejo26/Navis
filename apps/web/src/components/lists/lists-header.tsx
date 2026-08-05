import { LIST_OVERLAP_THRESHOLD, type ListSummary } from '@navis/shared';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/format';

/**
 * La cabecera del tablón (RFC 0010 §8.2).
 *
 * Tres líneas de texto y **ninguna tarjeta**: son las únicas cuentas de la
 * portada, y una fila de tarjetas grises delante de doce paneles de color sería
 * justo el mobiliario que la Regla 9 §2 nombra.
 *
 * La tercera **es un enlace** al listado de creyentes filtrado: una cifra que no
 * lleva a ninguna parte es un adorno (D36).
 */
export function ListsHeader({
  lists,
  overloaded,
  onAdd,
}: {
  lists: readonly ListSummary[];
  /** Cuánta gente está en cuatro listas o más. `null` si no se puede saber. */
  overloaded: number | null;
  onAdd?: () => void;
}) {
  const { t } = useTranslation();
  const total = lists.reduce((suma, one) => suma + one.memberCount, 0);

  return (
    <header className="gap-4 flex flex-wrap items-end justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{t('lists.title')}</h1>

        <p className="mt-1.5 text-sm text-muted-foreground">
          {t('lists.countLists', { count: lists.length })} · {formatNumber(total)}{' '}
          {t('lists.countPeople', { count: total })}
          {overloaded !== null && overloaded > 0 && (
            <>
              {' · '}
              <Link
                to={`/believers?inLists=${String(LIST_OVERLAP_THRESHOLD)}`}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {t('lists.overloaded', { count: overloaded, lists: LIST_OVERLAP_THRESHOLD })}
              </Link>
            </>
          )}
        </p>
      </div>

      {onAdd && (
        <Button size="lg" onClick={onAdd}>
          <Plus size={16} aria-hidden />
          {t('lists.add')}
        </Button>
      )}
    </header>
  );
}
