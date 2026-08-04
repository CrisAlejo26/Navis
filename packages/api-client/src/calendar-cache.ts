import type { AssignSlotInput, CalendarRange } from '@navis/shared';

export interface AssignVariables extends AssignSlotInput {
  /** El nombre ya compuesto, para poder pintarlo antes de que responda la API. */
  believerName?: string | null;
}

/**
 * Si eso que hay en la caché es un tramo de calendario.
 *
 * Bajo la misma raíz cuelgan el reparto, las sedes y los patrones, y el
 * parcheo optimista solo tiene sentido sobre los tramos.
 */
export function isCalendarRange(data: unknown): data is CalendarRange {
  return typeof data === 'object' && data !== null && Array.isArray((data as CalendarRange).days);
}

/**
 * El mismo tramo con la asignación ya puesta, para enseñarla al instante
 * mientras la petición viaja.
 *
 * Programar un mes son cincuenta clics: esperar a cada uno es perder la tarde.
 * Si la API falla, la mutación repone la copia anterior y avisa.
 */
export function withAssignment(range: CalendarRange, input: AssignVariables): CalendarRange {
  return {
    ...range,
    days: range.days.map((day) => {
      if (day.date !== input.date) return day;

      return {
        ...day,
        meetings: day.meetings.map((meeting) => {
          const isTarget = input.meetingId
            ? meeting.id === input.meetingId
            : meeting.patternId === input.patternId;
          if (!isTarget) return meeting;

          return {
            ...meeting,
            slots: meeting.slots.map((slot) =>
              slot.position === input.position
                ? {
                    ...slot,
                    believer: input.believerId
                      ? { id: input.believerId, name: input.believerName ?? '…' }
                      : null,
                    note: input.note === undefined ? slot.note : (input.note ?? null),
                  }
                : slot,
            ),
          };
        }),
      };
    }),
  };
}
