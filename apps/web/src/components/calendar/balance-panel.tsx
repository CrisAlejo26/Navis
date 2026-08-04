import { useCalendarSummary } from '@navis/api-client';
import type { CalendarWarning } from '@navis/shared';
import { useTranslation } from 'react-i18next';

import { Drawer } from '@/components/ui/drawer';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/format';
import type { DateRange } from '@/lib/calendar/view-range';

const WARNING_KEYS: Record<CalendarWarning['kind'], string> = {
  unassigned: 'calendar.warnUnassigned',
  twiceSameDay: 'calendar.warnTwiceSameDay',
  backToBack: 'calendar.warnBackToBack',
  twoVenues: 'calendar.warnTwoVenues',
};

/**
 * Quién sube cuántas veces y qué conviene revisar.
 *
 * Es lo que hoy no existe en ningún sitio: sin esto, el reparto se lleva de
 * memoria y siempre acaban subiendo los mismos tres.
 */
export function BalancePanel({
  open,
  onClose,
  range,
  calendarId,
  congregationIds,
}: {
  open: boolean;
  onClose: () => void;
  range: DateRange;
  calendarId: string;
  congregationIds: readonly string[];
}) {
  const { t } = useTranslation();
  const { data } = useCalendarSummary(api, { ...range, calendarId, congregationIds }, open);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      width="min(22rem, 92vw)"
      title={t('calendar.balance')}
    >
      <div className="p-4 gap-6 flex flex-col">
        <section className="gap-2 flex flex-col">
          <h3 className="font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t('calendar.warnings')}
          </h3>

          {data?.warnings.length === 0 && (
            <p className="text-sm text-muted-foreground">{t('calendar.noWarnings')}</p>
          )}

          <ul className="gap-2 flex flex-col">
            {data?.warnings.map((warning, index) => (
              <li key={`${warning.kind}-${warning.date}-${String(index)}`} className="text-sm">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatDate(warning.date, 'short')}
                </span>{' '}
                {t(WARNING_KEYS[warning.kind], {
                  name: warning.believerName ?? '',
                  detail: warning.detail,
                })}
              </li>
            ))}
          </ul>
        </section>

        <section className="gap-2 flex flex-col">
          <h3 className="font-semibold text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
            {t('calendar.balance')}
          </h3>

          <ul className="gap-1.5 flex flex-col">
            {data?.people.map((person) => (
              <li key={person.believerId} className="gap-3 flex items-baseline justify-between">
                <span className="text-sm font-medium truncate">{person.name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {person.times}
                  {person.lastDate ? ` · ${formatDate(person.lastDate, 'short')}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Drawer>
  );
}
