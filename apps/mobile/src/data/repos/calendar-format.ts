/**
 * El formateo de las reuniones del repositorio del calendario — la pareja
 * local de `apps/api/src/calendar/calendar-format.ts`: misma forma para las
 * reuniones **reales** y las **propuestas** (solo distinguen por `id` nulo),
 * y el mismo orden — por hora y, a igual hora, por sede.
 */

import type { Meeting, MeetingSlot } from '@navis/shared';

/** `20:00:00` → `20:00`: en la base se guarda lo que se escribió, pero se
 * normaliza en la frontera para que la interfaz reciba siempre lo mismo. */
export function toHm(value: string | null | undefined): string {
    return (value ?? '').slice(0, 5);
}

export function slotView(
    slot: {
        id: string;
        name: string;
        position: number;
        /** Quien la ocupa, en el orden elegido. Vacío es sin asignar. */
        believerIds: readonly string[];
        note: string | null;
    },
    names: ReadonlyMap<string, string>,
): MeetingSlot {
    return {
        id: slot.id,
        name: slot.name,
        position: slot.position,
        note: slot.note,
        believers: slot.believerIds.map((id) => ({ id, name: names.get(id) ?? '—' })),
    };
}

/** Dentro de un día se ordenan por hora, y a igual hora por sede. */
export function byTimeThenCongregation(
    order: ReadonlyMap<string, number>,
): (a: Meeting, b: Meeting) => number {
    return (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        (order.get(a.congregationId) ?? 0) - (order.get(b.congregationId) ?? 0);
}
