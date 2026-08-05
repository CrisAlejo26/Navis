import type { BelieversSummary } from '@navis/shared';
import { HandHeart, Sprout, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';

/**
 * La cabecera de la sección: **una frase, no un panel de indicadores** (§7.1).
 *
 * Cuatro tarjetas con un número grande y una etiqueta pequeña es la salida por
 * defecto de cualquier producto (Regla 9 §2), y además separa el número del
 * filtro. Las cuentas que **se pulsan** viven en las pastillas de abajo; aquí
 * solo se lee cómo está la iglesia, en una línea.
 *
 * El sobretítulo dice a qué viene esta pantalla. No es adorno: la pregunta que
 * responde no es «¿quién está?», es «¿con quién se ha perdido el hilo?».
 */
export function BelieversHeader({
  summary,
  canManage,
  onAdd,
}: {
  summary: BelieversSummary | undefined;
  canManage: boolean;
  onAdd: () => void;
}) {
  const { t } = useTranslation();

  return (
    <header className="gap-4 sm:flex-row sm:items-end sm:justify-between flex flex-col">
      <div className="min-w-0">
        <p className="font-medium text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
          {t('believers.lead')}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{t('believers.title')}</h1>

        {summary && (
          <p className="mt-1.5 text-sm text-muted-foreground tabular-nums">
            {t('believers.total', { count: summary.total })}
            {summary.newThisMonth > 0 && (
              <> · {t('believers.newThisMonth', { count: summary.newThisMonth })}</>
            )}
            {summary.needsAttention > 0 && (
              <>
                {' · '}
                <strong className="font-semibold text-warning">
                  {t('believers.attentionCount', { count: summary.needsAttention })}
                </strong>
              </>
            )}
          </p>
        )}
      </div>

      {canManage && (
        <div className="gap-2 sm:self-auto flex shrink-0 items-center self-start">
          <Link
            to="/believers/gifts"
            className="h-10 gap-2 px-3 text-sm inline-flex items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Sprout size={16} aria-hidden />
            <span className="sm:not-sr-only sr-only">{t('gifts.manage')}</span>
          </Link>

          <Link
            to="/believers/ministries"
            className="h-10 gap-2 px-3 text-sm inline-flex items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <HandHeart size={16} aria-hidden />
            <span className="sm:not-sr-only sr-only">{t('ministries.manage')}</span>
          </Link>

          <Button size="md" onClick={onAdd}>
            <UserPlus size={16} aria-hidden />
            {t('believers.add')}
          </Button>
        </div>
      )}
    </header>
  );
}
