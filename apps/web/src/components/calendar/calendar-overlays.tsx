import type { Congregation } from '@navis/shared';

import { AddCongregationDialog } from '@/components/calendar/add-congregation-dialog';
import { AddMeetingDialog } from '@/components/calendar/add-meeting-dialog';
import { BalancePanel } from '@/components/calendar/balance-panel';
import { DayPanel } from '@/components/calendar/day-panel';
import { PreacherPicker } from '@/components/calendar/preacher-picker';
import { ShareSheet } from '@/components/calendar/share-sheet';
import type { useCalendarScreen } from '@/components/calendar/use-calendar-screen';

/**
 * Todo lo que se abre **encima** del calendario: el día, el selector de
 * personas, la hoja de compartir, el reparto y las dos altas rápidas.
 *
 * Van juntos y aparte de la pantalla para que la ruta se quede en composición
 * y no en una lista de seis modales (Regla 6).
 */
export function CalendarOverlays({
  screen,
  congregations,
  churchName,
  canManage,
  congregationName,
}: {
  screen: ReturnType<typeof useCalendarScreen>;
  congregations: readonly Congregation[];
  churchName: string;
  canManage: boolean;
  congregationName: (id: string) => string | undefined;
}) {
  const { params } = screen;
  const day = screen.calendar.data?.days.find((one) => one.date === screen.openDay);

  return (
    <>
      <DayPanel
        date={screen.openDay}
        day={day}
        congregations={congregations}
        canManage={canManage}
        onClose={() => {
          screen.setOpenDay(null);
        }}
        onPick={screen.pick}
        onAddFor={screen.setAddMeetingFor}
      />

      <PreacherPicker
        target={screen.target}
        range={params.range}
        congregationName={(id) => (id ? congregationName(id) : undefined)}
        onClose={() => {
          screen.setTarget(null);
        }}
        onAssign={screen.applyAssignment}
      />

      <ShareSheet
        open={screen.shareOpen}
        onClose={() => {
          screen.setShareOpen(false);
        }}
        anchor={params.anchor}
        selectedDate={screen.openDay}
        churchName={churchName}
        congregations={congregations}
        congregationIds={params.filters.congregationIds}
      />

      <BalancePanel
        open={screen.balanceOpen}
        onClose={() => {
          screen.setBalanceOpen(false);
        }}
        range={params.range}
        congregationIds={params.filters.congregationIds}
      />

      <AddCongregationDialog
        open={screen.addCongregation}
        onClose={() => {
          screen.setAddCongregation(false);
        }}
      />

      <AddMeetingDialog
        date={screen.addMeetingFor ? screen.openDay : null}
        congregations={congregations}
        congregationId={screen.addMeetingFor ?? ''}
        onClose={() => {
          screen.setAddMeetingFor(null);
        }}
      />
    </>
  );
}
