import { useAssignSlot, useCalendar, useCongregations } from '@navis/api-client';
import type { Meeting, MeetingSlot } from '@navis/shared';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { PickTarget } from '@/components/calendar/preacher-picker';
import { api } from '@/lib/api';
import { useCalendarParams } from '@/lib/calendar/params';
import { CALENDAR_VIEWS, type CalendarView } from '@/lib/calendar/view-range';
import { toast } from '@/lib/toast';

/** `M`, `S`, `A`, `P`: la vista se cambia sin soltar el teclado. */
const SHORTCUTS: Record<string, CalendarView> = { m: 'month', s: 'week', a: 'agenda', p: 'people' };

/**
 * Todo el estado de la pantalla de calendario en un sitio: qué se está
 * mirando, qué panel está abierto y qué pasa al asignar.
 *
 * Vive aparte de la vista para que la ruta se quede en composición (Regla 6) y
 * para que los cuatro modos de mirar compartan exactamente el mismo estado.
 */
export function useCalendarScreen() {
  const { t } = useTranslation();
  const params = useCalendarParams();

  const [openDay, setOpenDay] = useState<string | null>(null);
  const [target, setTarget] = useState<PickTarget | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [addCongregation, setAddCongregation] = useState(false);
  const [addMeetingFor, setAddMeetingFor] = useState<string | null>(null);

  const { data: congregations = [] } = useCongregations(api);
  const calendar = useCalendar(api, {
    ...params.range,
    congregationIds: params.filters.congregationIds,
  });
  const assign = useAssignSlot(api);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target_ = event.target;
      const typing =
        target_ instanceof HTMLElement && /input|textarea|select/i.test(target_.tagName);
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      const view = SHORTCUTS[event.key.toLowerCase()];
      if (view && CALENDAR_VIEWS.includes(view)) params.setView(view);
    };

    globalThis.addEventListener('keydown', onKey);
    return () => {
      globalThis.removeEventListener('keydown', onKey);
    };
  });

  const pick = (slot: MeetingSlot, meeting: Meeting, date: string) => {
    setTarget({ slot, meeting, date });
  };

  const applyAssignment = (believerId: string | null, name: string | null) => {
    if (!target) return;

    assign.mutate(
      {
        date: target.date,
        meetingId: target.meeting.id ?? undefined,
        patternId: target.meeting.patternId ?? undefined,
        position: target.slot.position,
        believerId,
        believerName: name,
      },
      {
        onError: () => {
          toast.error(t('calendar.saveFailed'));
        },
      },
    );

    setTarget(null);
  };

  return {
    params,
    congregations,
    calendar,
    openDay,
    setOpenDay,
    target,
    setTarget,
    pick,
    applyAssignment,
    shareOpen,
    setShareOpen,
    balanceOpen,
    setBalanceOpen,
    addCongregation,
    setAddCongregation,
    addMeetingFor,
    setAddMeetingFor,
  };
}
