import type { MeetingSlot } from './meeting-slot.entity';

/** Las personas que cargan las reuniones: `slots` con sus `people`. */
export const SLOTS_WITH_PEOPLE = { slots: { people: true } } as const;

/**
 * Los identificadores de quien ocupa la fase, en el orden en que se eligieron.
 * Una relación cargada no viene ordenada en Postgres, así que se ordena aquí.
 */
export function slotBelieverIds(slot: Pick<MeetingSlot, 'people'>): string[] {
    return [...(slot.people ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((person) => person.believerId);
}

/** Todos los identificadores de las fases de un lote de reuniones, para pedir sus nombres. */
export function believerIdsOf(
    meetings: readonly { slots?: readonly Pick<MeetingSlot, 'people'>[] }[],
): string[] {
    return meetings.flatMap((meeting) => (meeting.slots ?? []).flatMap(slotBelieverIds));
}
