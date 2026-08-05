import { prophecyState, waitingDays, type Prophecy } from '@navis/shared';
import { Anchor, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StateBadge } from '@/components/prophecies/state-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { formatDay, formatNumber } from '@/lib/format';
import { STATE_SURFACE } from '@/lib/prophecies/state-icons';

/**
 * Quién es esta profecía: título, estado y **la espera**, que es lo que se
 * viene a saber (RFC 0004 §7.6).
 *
 * Es una cabecera a lo ancho y teñida según el estado, igual que la ficha de un
 * sueño: era una columna estrecha a la izquierda, y con ella la palabra —que es
 * lo que se viene a leer— empezaba a media pantalla.
 *
 * La acción principal cambia con el estado, y eso es lo que evita cuatro pasos
 * para uno: mientras sigue abierta, lo que más se pulsa es **«Ya se cumplió»**;
 * una vez cerrada, ya no tiene sentido y su sitio lo ocupa «Volver a abrirla».
 */
export function ProphecyIdentity({
  prophecy,
  today,
  onEdit,
  onFulfill,
  onMarkFulfilled,
  onReopen,
  onDelete,
}: {
  prophecy: Prophecy;
  today: string;
  onEdit: () => void;
  onFulfill: () => void;
  /** Abre el diálogo de un solo campo: la fecha de cumplimiento. */
  onMarkFulfilled: () => void;
  onReopen: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  const state = prophecyState(prophecy);
  const days = formatNumber(waitingDays(prophecy, today));

  return (
    <header
      className={cn(
        'gap-4 p-5 sm:p-6 animate-rise-in flex flex-col rounded-xl border',
        STATE_SURFACE[state],
      )}
    >
      <div className="gap-3 flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            {prophecy.fulfilledAt
              ? t('prophecies.fulfilledOn', { date: formatDay(prophecy.fulfilledAt) })
              : t('prophecies.receivedOn', { date: formatDay(prophecy.receivedAt) })}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-[-0.02em]">{prophecy.title}</h1>
        </div>

        <span className="gap-0.5 flex shrink-0">
          <Button variant="ghost" size="icon" aria-label={t('prophecies.edit')} onClick={onEdit}>
            <Pencil size={16} aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            title={t('common.delete')}
            aria-label={t('prophecies.deleteTitle', { title: prophecy.title })}
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 size={16} aria-hidden />
          </Button>
        </span>
      </div>

      <div className="gap-3 flex flex-wrap items-center">
        <StateBadge state={state} />
        <span className="text-sm text-muted-foreground tabular-nums">
          {prophecy.fulfilledAt
            ? t('prophecies.waitedFor', { days })
            : t('prophecies.waitingFor', { days })}
        </span>
      </div>

      <div className="gap-2 flex flex-wrap">
        {/* 48 px: es lo que más se pulsa aquí y se pulsa de pie (Regla 5 §4). */}
        {prophecy.fulfilledAt ? (
          <Button size="lg" variant="secondary" onClick={onReopen}>
            <RotateCcw size={18} aria-hidden />
            {t('prophecies.reopen')}
          </Button>
        ) : (
          <Button size="lg" onClick={onMarkFulfilled}>
            <Anchor size={18} aria-hidden />
            {t('prophecies.markFulfilled')}
          </Button>
        )}

        <Button variant="secondary" size="lg" onClick={onFulfill}>
          {t('prophecies.addFulfillment')}
        </Button>
      </div>
    </header>
  );
}
