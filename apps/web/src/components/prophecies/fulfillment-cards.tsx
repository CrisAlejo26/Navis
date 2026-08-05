import type { ProphecyFulfillment } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';

/**
 * Los cumplimientos en rejilla (RFC 0004 §7.6).
 *
 * Para verlos **todos a la vez** en vez de en columna: con diez o quince, la
 * secuencia vertical obliga a desplazarse para saber cuántos hay.
 */
export function FulfillmentCards({
  fulfillments,
  onEdit,
  onDelete,
}: {
  fulfillments: ProphecyFulfillment[];
  onEdit: (fulfillment: ProphecyFulfillment) => void;
  onDelete: (fulfillment: ProphecyFulfillment) => void;
}) {
  const { t } = useTranslation();

  if (fulfillments.length === 0) {
    return (
      <div className="gap-1 py-8 px-4 flex flex-col rounded-lg border border-dashed text-center">
        <p className="text-sm">{t('prophecies.fulfillmentsEmpty')}</p>
        <p className="text-xs text-muted-foreground">{t('prophecies.fulfillmentsEmptyHint')}</p>
      </div>
    );
  }

  return (
    <ul className="gap-3 sm:grid-cols-2 grid">
      {fulfillments.map((fulfillment, index) => (
        <li
          key={fulfillment.id}
          style={{ animationDelay: `${String(Math.min(index, 8) * 50)}ms` }}
          className="gap-2 p-4 animate-rise-in flex flex-col rounded-xl border bg-card"
        >
          <div className="gap-2 flex items-start justify-between">
            <time
              dateTime={fulfillment.occurredAt}
              className="font-medium tracking-wide text-[11px] text-muted-foreground uppercase tabular-nums"
            >
              {formatDate(fulfillment.occurredAt)}
            </time>

            <span className="gap-0.5 flex shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                title={t('prophecies.editFulfillment')}
                aria-label={t('prophecies.editFulfillment')}
                onClick={() => {
                  onEdit(fulfillment);
                }}
              >
                <Pencil size={13} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                title={t('common.delete')}
                aria-label={t('prophecies.deleteFulfillmentTitle')}
                onClick={() => {
                  onDelete(fulfillment);
                }}
              >
                <Trash2 size={13} aria-hidden />
              </Button>
            </span>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap">{fulfillment.text}</p>
        </li>
      ))}
    </ul>
  );
}
