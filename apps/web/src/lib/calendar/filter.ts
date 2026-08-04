import type { Meeting, MeetingSlot } from '@navis/shared';

export interface DisplayFilters {
  personId: string | null;
  pending: boolean;
  q: string;
}

/** Sin acentos y en minúsculas: «jesus» tiene que encontrar a «Jesús». */
function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function hasDisplayFilters(filters: DisplayFilters): boolean {
  return Boolean(filters.personId) || filters.pending || Boolean(filters.q);
}

/**
 * Si esta fase es de las que se están buscando.
 *
 * Los filtros **no esconden el calendario, lo atenúan** (§8.3): vaciar la
 * rejilla haría perder el contexto de la semana, que es justo lo que se está
 * mirando cuando se pregunta «¿quién más va este día?».
 */
export function slotMatches(slot: MeetingSlot, meeting: Meeting, filters: DisplayFilters): boolean {
  if (filters.personId && slot.believer?.id !== filters.personId) return false;
  if (filters.pending && slot.believer) return false;

  if (filters.q) {
    const haystack = normalize(`${meeting.name} ${slot.name} ${slot.believer?.name ?? ''}`);
    if (!haystack.includes(normalize(filters.q))) return false;
  }

  return true;
}

/** Una reunión cuenta si alguna de sus fases cuenta. */
export function meetingMatches(meeting: Meeting, filters: DisplayFilters): boolean {
  if (!hasDisplayFilters(filters)) return true;
  return meeting.slots.some((slot) => slotMatches(slot, meeting, filters));
}
