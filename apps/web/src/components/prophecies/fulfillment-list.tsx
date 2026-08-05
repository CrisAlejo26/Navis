import type { ProphecyFulfillment } from '@navis/shared';
import { Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/format';

/**
 * Los cumplimientos parciales, hacia atrás (RFC 0004 §7.6).
 *
 * Van unidos por un filete vertical que los enhebra: se leen como una
 * secuencia porque lo son — la palabra se fue cumpliendo a trozos, y ese orden
 * es la mitad de lo que se viene a releer.
 */
export function FulfillmentList({
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
    <ol className="pl-4 flex flex-col border-l-2 border-primary/25">
      {fulfillments.map((fulfillment, index) => (
        <li
          key={fulfillment.id}
          // Entran escalonados, de arriba abajo: se leen como una secuencia y
          // así también se ven aparecer como una (§7.8).
          style={{ animationDelay: `${String(Math.min(index, 10) * 55)}ms` }}
          className="gap-1 pb-5 last:pb-0 animate-rise-in relative flex flex-col"
        >
          {/* La marca de la secuencia, alineada con el filete. */}
          <span
            aria-hidden
            className="top-1.5 h-2 w-2 absolute -left-[21px] rounded-full bg-primary ring-2 ring-background"
          />

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
                className="h-8 w-8"
                title={t('prophecies.editFulfillment')}
                aria-label={t('prophecies.editFulfillment')}
                onClick={() => {
                  onEdit(fulfillment);
                }}
              >
                <Pencil size={14} aria-hidden />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                title={t('common.delete')}
                aria-label={t('prophecies.deleteFulfillmentTitle')}
                onClick={() => {
                  onDelete(fulfillment);
                }}
              >
                <Trash2 size={14} aria-hidden />
              </Button>
            </span>
          </div>

          <p className="text-sm leading-relaxed whitespace-pre-wrap">{fulfillment.text}</p>
        </li>
      ))}
    </ol>
  );
}
