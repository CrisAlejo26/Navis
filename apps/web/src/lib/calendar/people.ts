import type { CalendarRange } from '@navis/shared';

export interface PersonDay {
  date: string;
  accent: string;
  detail: string;
}

export interface PersonRow {
  id: string;
  name: string;
  times: number;
  lastDate: string | null;
  /** Los días en los que le toca, por fecha. */
  days: Map<string, PersonDay[]>;
}

/**
 * La misma información del calendario, **girada**: una fila por persona y sus
 * días. Es lo que hoy no existe en ninguna parte y lo que evita cargar siempre
 * a los mismos tres (§8.3).
 *
 * Se calcula sobre el tramo que ya está en pantalla: no hace falta pedir nada
 * más al servidor para cambiar de vista.
 */
export function peopleRows(range: CalendarRange): PersonRow[] {
  const rows = new Map<string, PersonRow>();

  for (const day of range.days) {
    for (const meeting of day.meetings) {
      if (meeting.status === 'cancelada') continue;

      for (const slot of meeting.slots) {
        const person = slot.believer;
        if (!person) continue;

        const row = rows.get(person.id) ?? {
          id: person.id,
          name: person.name,
          times: 0,
          lastDate: null,
          days: new Map<string, PersonDay[]>(),
        };

        row.times += 1;
        if (!row.lastDate || day.date > row.lastDate) row.lastDate = day.date;
        row.days.set(day.date, [
          ...(row.days.get(day.date) ?? []),
          { date: day.date, accent: meeting.accent, detail: `${meeting.name} · ${slot.name}` },
        ]);

        rows.set(person.id, row);
      }
    }
  }

  return [...rows.values()].sort((a, b) => b.times - a.times || a.name.localeCompare(b.name));
}
