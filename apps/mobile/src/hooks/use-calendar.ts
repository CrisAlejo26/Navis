import type {
  AssignSlotInput,
  Calendar,
  CalendarRange,
  CalendarSummary,
  CreateMeetingInput,
  CreatePatternInput,
  MeetingPattern,
  Paginated,
  Preacher,
  UpdateMeetingInput,
  UpdatePatternInput,
} from '@navis/shared';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryResult,
} from '@tanstack/react-query';

import { calendarRange } from '@/data/repos/calendar-schedule';
import { toSearchName } from '@navis/shared';
import {
  assignSlot,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  setMeetingSlots,
} from '@/data/repos/calendar-assignments';
import {
  listCalendars,
  createCalendar,
  updateCalendar,
  deleteCalendar,
  listCongregations,
  createCongregation,
  updateCongregation,
  deleteCongregation,
  type LocalCalendar,
} from '@/data/repos/calendar-repo';
import {
  listPatterns,
  createPattern,
  updatePattern,
  deletePattern,
} from '@/data/repos/calendar-settings';
import { listPreachers } from '@/data/repos/calendar-preachers';
import { calendarSummary } from '@/data/repos/calendar-balance';
import { useLocalSession } from '@/stores/local-session';

/**
 * Los hooks del calendario **en local**: las pantallas no saben que los datos
 * vienen de SQLite —esa frontera vive en `src/data/repos/`— y las claves
 * cuelgan todas de `['calendar', churchId]` para invalidarlas juntas, igual
 * que `refresh` en el cliente de la API.
 */

const listKey = (churchId: string, calendarId: string, query: { from: string; to: string }) =>
  ['calendar', churchId, calendarId, 'range', query.from, query.to] as const;

/** El tramo de un calendario: el mes, la agenda y el día beben de aquí. */
export function useCalendarSchedule(calendarId: string, from: string, to: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  return useQuery({
    queryKey: listKey(churchId ?? '', calendarId, { from, to }),
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa no hay calendario');
      return calendarRange(churchId, calendarId, from, to);
    },
    enabled: Boolean(churchId) && Boolean(calendarId),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
  });
}

export function useCalendars(): UseQueryResult<LocalCalendar[]> {
  const churchId = useLocalSession((state) => state.session?.churchId);
  return useQuery({
    queryKey: ['calendar', churchId, 'calendars'],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa no hay calendarios');
      return listCalendars(churchId);
    },
    enabled: Boolean(churchId),
    staleTime: 300_000,
  });
}

export function useCongregations() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  return useQuery({
    queryKey: ['calendar', churchId, 'congregations'],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa no hay sedes');
      return listCongregations(churchId);
    },
    enabled: Boolean(churchId),
    staleTime: 300_000,
  });
}

/** El reparto del tramo y los avisos. */
export function useCalendarSummary(calendarId: string, from: string, to: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  return useQuery({
    queryKey: ['calendar', churchId, 'summary', calendarId, from, to],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa no hay resumen');
      return calendarSummary(churchId, calendarId, from, to);
    },
    enabled: Boolean(churchId) && Boolean(calendarId),
    staleTime: 30_000,
  });
}

export interface PreacherQuery {
  calendarId: string;
  ministry: string | null;
  q?: string;
  all?: boolean;
  from: string;
  to: string;
}

/** De cuántos en cuántos: el selector carga por tandas, no a la iglesia entera. */
export const PREACHER_PAGE_SIZE = 20;

export function usePreachers(query: PreacherQuery) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  return useInfiniteQuery({
    queryKey: [
      'calendar',
      churchId,
      'preachers',
      query.calendarId,
      query.q ?? '',
      !!query.all,
      query.from,
      query.to,
    ],
    queryFn: ({ pageParam }) => {
      if (!churchId) throw new Error('Sin iglesia activa no hay candidatos');
      return listPreachers(churchId, {
        calendarId: query.calendarId,
        ministry: query.ministry ?? null,
        q: query.q ? toSearchName(query.q) : undefined,
        all: query.all,
        from: query.from,
        to: query.to,
        page: pageParam,
        limit: PREACHER_PAGE_SIZE,
      });
    },
    initialPageParam: 1,
    getNextPageParam: (last: Paginated<Preacher>) =>
      last.page < last.totalPages ? last.page + 1 : undefined,
    enabled: Boolean(churchId) && Boolean(query.calendarId),
    staleTime: 30_000,
  });
}

/** El buscador del selector quita acentos: es el mismo `toSearchName` (Regla 1). */

function useInvalidate() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: ['calendar'] });
}

/** Poner a alguien en una fase: se pinta al instante y se corrige si falla. */
export function useAssignSlot(calendarId: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: AssignSlotInput) => {
      if (!churchId) throw new Error('Sin iglesia activa no se asigna');
      return assignSlot(churchId, input);
    },
    onSuccess: invalidate,
  });
}

export function useCreateMeeting(calendarId: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreateMeetingInput) => {
      if (!churchId) throw new Error('Sin iglesia activa no se crea');
      return createMeeting(churchId, calendarId, input);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateMeeting(calendarId: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: UpdateMeetingInput & { id: string }) => {
      if (!churchId) throw new Error('Sin iglesia activa no se guarda');
      return updateMeeting(churchId, input);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMeeting() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deleteMeeting(id),
    onSuccess: invalidate,
  });
}

export function useSetMeetingSlots() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { id: string; slots: { name: string; believerId?: string | null }[] }) => {
      if (!churchId) throw new Error('Sin iglesia activa no se guarda');
      return setMeetingSlots(churchId, input);
    },
    onSuccess: invalidate,
  });
}

export function useCreateCalendar() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { name: string; ministry?: string | null }) => {
      if (!churchId) throw new Error('Sin iglesia activa no se crea');
      return createCalendar(churchId, input);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCalendar() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; ministry?: string | null }) => {
      if (!churchId) throw new Error('Sin iglesia activa no se guarda');
      return updateCalendar(churchId, input);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCalendar() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => {
      if (!churchId) throw new Error('Sin iglesia activa no se borra');
      return deleteCalendar(churchId, id);
    },
    onSuccess: invalidate,
  });
}

export function useCreateCongregation() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { name: string; city?: string; accent?: string }) => {
      if (!churchId) throw new Error('Sin iglesia activa no se crea');
      return createCongregation(churchId, input);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateCongregation() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: { id: string; name?: string; city?: string | null; accent?: string }) => {
      if (!churchId) throw new Error('Sin iglesia activa no se guarda');
      return updateCongregation(churchId, input);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteCongregation() {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => {
      if (!churchId) throw new Error('Sin iglesia activa no se borra');
      return deleteCongregation(churchId, id);
    },
    onSuccess: invalidate,
  });
}

export function usePatterns(calendarId: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  return useQuery({
    queryKey: ['calendar', churchId, 'patterns', calendarId],
    queryFn: () => {
      if (!churchId) throw new Error('Sin iglesia activa no hay reuniones fijas');
      return listPatterns(calendarId);
    },
    enabled: Boolean(churchId) && Boolean(calendarId),
    staleTime: 300_000,
  });
}

export function useCreatePattern(calendarId: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: CreatePatternInput) => {
      if (!churchId) throw new Error('Sin iglesia activa no se crea');
      return createPattern(churchId, calendarId, input);
    },
    onSuccess: invalidate,
  });
}

export function useUpdatePattern(calendarId: string) {
  const churchId = useLocalSession((state) => state.session?.churchId);
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: UpdatePatternInput & { id: string }) => {
      if (!churchId) throw new Error('Sin iglesia activa no se guarda');
      return updatePattern(churchId, calendarId, input);
    },
    onSuccess: invalidate,
  });
}

export function useDeletePattern() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => deletePattern(id),
    onSuccess: invalidate,
  });
}

export type { Calendar, CalendarRange, CalendarSummary, MeetingPattern, LocalCalendar };
