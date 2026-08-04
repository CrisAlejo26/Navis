import { useMyChurches } from '@navis/api-client';
import { Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { CalendarFilters } from '@/components/calendar/calendar-filters';
import { CalendarOverlays } from '@/components/calendar/calendar-overlays';
import { CalendarToolbar } from '@/components/calendar/calendar-toolbar';
import { CalendarViews } from '@/components/calendar/calendar-views';
import { useCalendarScreen } from '@/components/calendar/use-calendar-screen';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { api } from '@/lib/api';
import { usePermissions } from '@/lib/permissions';
import { useIsNarrow } from '@/lib/use-media-query';

/**
 * El calendario de programaciones (RFC 0002).
 *
 * Ocupa el alto entero y no vive dentro de una tarjeta: el calendario **es** la
 * página. Aquí solo hay composición; el estado está en `useCalendarScreen`,
 * cada vista en su componente y lo que se abre encima en `CalendarOverlays`
 * (Regla 6).
 */
export function CalendarPage() {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const narrow = useIsNarrow();
  const screen = useCalendarScreen();
  const { data: churches } = useMyChurches(api);

  const canManage = can('calendar.manage');
  const { params, congregations, calendar } = screen;
  const range = calendar.data;

  const nameOf = (id: string) => congregations.find((one) => one.id === id)?.name;
  const churchName =
    churches?.items.find((one) => one.id === churches.activeId)?.name ?? t('common.appName');

  /*
   * De `md` para arriba el calendario ocupa el alto entero y es la rejilla la
   * que se desplaza. Por debajo no: ahí manda la agenda, que es una lista, y
   * encerrarla en un alto fijo dejaría un panel diminuto entre la barra y el
   * borde de la pantalla (Regla 5).
   */
  return (
    <section className="gap-4 md:h-[calc(100dvh-4rem)] flex flex-col">
      <CalendarToolbar
        params={params}
        canManage={canManage}
        onShare={() => {
          screen.setShareOpen(true);
        }}
      />

      <div className="gap-2 flex flex-wrap items-center justify-between">
        <CalendarFilters
          params={params}
          congregations={congregations}
          onAddCongregation={
            canManage
              ? () => {
                  screen.setAddCongregation(true);
                }
              : undefined
          }
        />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            screen.setBalanceOpen(true);
          }}
        >
          <Scale size={15} aria-hidden />
          {t('calendar.balance')}
        </Button>
      </div>

      {!range && <PageSkeleton />}

      {range && (
        <CalendarViews
          view={params.view}
          range={range}
          anchor={params.anchor}
          narrow={narrow}
          selectedDate={screen.openDay}
          filters={params.filters}
          congregationName={nameOf}
          onOpenDay={screen.setOpenDay}
          onPick={canManage ? screen.pick : undefined}
          onPickPerson={(personId) => {
            params.setFilters({ personId });
          }}
        />
      )}

      <CalendarOverlays
        screen={screen}
        congregations={congregations}
        churchName={churchName}
        canManage={canManage}
        congregationName={nameOf}
      />
    </section>
  );
}
