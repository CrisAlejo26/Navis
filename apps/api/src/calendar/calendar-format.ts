import type { Meeting as MeetingView } from '@navis/shared';

import type { MeetingPattern } from './meeting-pattern.entity';
import type { Meeting } from './meeting.entity';

/**
 * `20:00:00` → `20:00`.
 *
 * Postgres devuelve las columnas `time` con segundos y SQLite devuelve lo que
 * se guardó. Se normaliza en la frontera para que la interfaz reciba siempre
 * lo mismo y no tenga que adivinar.
 */
export function toHm(value: string | null | undefined): string {
  return (value ?? '').slice(0, 5);
}

/**
 * La reunión que **todavía no existe**: la propuesta que sale de un patrón
 * para un día concreto (D3). Se distingue porque su `id` y los de sus fases
 * son nulos; al asignar a alguien, el servidor la materializa.
 */
export function proposedMeeting(pattern: MeetingPattern): MeetingView {
  return {
    id: null,
    congregationId: pattern.congregationId,
    patternId: pattern.id,
    name: pattern.name,
    startTime: toHm(pattern.startTime),
    accent: pattern.accent,
    status: 'programada',
    notes: null,
    slots: [...pattern.phases]
      .sort((a, b) => a.position - b.position)
      .map((phase) => ({
        id: null,
        name: phase.name,
        position: phase.position,
        note: null,
        believer: null,
      })),
  };
}

/** La reunión ya materializada, con el nombre de cada persona ya compuesto. */
export function meetingView(meeting: Meeting, names: ReadonlyMap<string, string>): MeetingView {
  return {
    id: meeting.id,
    congregationId: meeting.congregationId,
    patternId: meeting.patternId,
    name: meeting.name,
    startTime: toHm(meeting.startTime),
    accent: meeting.accent,
    status: meeting.status,
    notes: meeting.notes,
    slots: [...(meeting.slots ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((slot) => ({
        id: slot.id,
        name: slot.name,
        position: slot.position,
        note: slot.note,
        believer: slot.believerId
          ? { id: slot.believerId, name: names.get(slot.believerId) ?? '—' }
          : null,
      })),
  };
}

/** Dentro de un día se ordenan por hora, y a igual hora por sede. */
export function byTimeThenCongregation(
  order: ReadonlyMap<string, number>,
): (a: MeetingView, b: MeetingView) => number {
  return (a, b) =>
    a.startTime.localeCompare(b.startTime) ||
    (order.get(a.congregationId) ?? 0) - (order.get(b.congregationId) ?? 0);
}
