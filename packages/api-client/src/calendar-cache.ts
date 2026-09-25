import type { AssignSlotInput, CalendarRange, MeetingSlot } from '@navis/shared';

export interface AssignVariables extends AssignSlotInput {
    /**
     * Los nombres ya compuestos de quien entra, para pintarlos antes de que
     * responda la API. Quien ya estaba en la fase conserva el suyo.
     */
    believers?: MeetingSlot['believers'];
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
                                      believers: input.believerIds.map(
                                          (id) =>
                                              input.believers?.find((one) => one.id === id) ??
                                              slot.believers.find((one) => one.id === id) ?? {
                                                  id,
                                                  name: '…',
                                              },
                                      ),
                                      note:
                                          input.note === undefined
                                              ? slot.note
                                              : (input.note ?? null),
                                  }
                                : slot,
                        ),
                    };
                }),
            };
        }),
    };
}
