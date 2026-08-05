import { prophecyState, waitingDays, type Prophecy } from '@navis/shared';
import { Anchor, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { StateBadge } from '@/components/prophecies/state-badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatNumber } from '@/lib/format';

/**
 * Quién es esta profecía: título, estado y **la espera**, que es lo que se
 * viene a saber (RFC 0004 §7.6).
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
    <div className="gap-4 lg:sticky lg:top-4 animate-rise-in flex flex-col">
      <div className="gap-2 flex flex-col">
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">{prophecy.title}</h1>
        <StateBadge state={state} className="self-start" />
      </div>

      <p className="text-sm text-muted-foreground tabular-nums">
        {prophecy.fulfilledAt
          ? `${t('prophecies.fulfilledOn', { date: formatDate(prophecy.fulfilledAt) })} · ${t('prophecies.waitedFor', { days })}`
          : `${t('prophecies.receivedOn', { date: formatDate(prophecy.receivedAt) })} · ${t('prophecies.waitingFor', { days })}`}
      </p>

      <div className="gap-2 flex flex-col">
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

        <Button variant="secondary" size="md" onClick={onFulfill}>
          {t('prophecies.addFulfillment')}
        </Button>

        <div className="gap-2 flex">
          <Button variant="ghost" size="md" className="flex-1" onClick={onEdit}>
            <Pencil size={16} aria-hidden />
            {t('prophecies.edit')}
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
        </div>
      </div>
    </div>
  );
}
