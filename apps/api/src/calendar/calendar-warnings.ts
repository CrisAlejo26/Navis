import { addDays, type CalendarWarning } from '@navis/shared';

export interface Assignment {
  believerId: string;
  name: string;
  date: string;
  congregationId: string;
  detail: string;
}

export interface Gap {
  date: string;
  congregationId: string;
  detail: string;
}

/**
 * Los avisos del tramo (§7.3). Se calculan en el servidor y no en la pantalla
 * porque los quiere también el panel de inicio y, más adelante, el recordatorio
 * de la RFC 0006.
 *
 * Ninguno bloquea nada: repetir a alguien dos días seguidos puede ser
 * exactamente lo que se quiere. Solo hay que verlo antes de mandarlo.
 */
export function buildWarnings(
  assignments: readonly Assignment[],
  gaps: readonly Gap[],
): CalendarWarning[] {
  return [...gapWarnings(gaps), ...repeatWarnings(assignments)];
}

function gapWarnings(gaps: readonly Gap[]): CalendarWarning[] {
  return gaps.map((gap) => ({
    kind: 'unassigned' as const,
    date: gap.date,
    believerId: null,
    believerName: null,
    congregationId: gap.congregationId,
    detail: gap.detail,
  }));
}

function repeatWarnings(assignments: readonly Assignment[]): CalendarWarning[] {
  const warnings: CalendarWarning[] = [];
  const byPerson = new Map<string, Assignment[]>();

  for (const assignment of assignments) {
    byPerson.set(assignment.believerId, [
      ...(byPerson.get(assignment.believerId) ?? []),
      assignment,
    ]);
  }

  for (const [believerId, list] of byPerson) {
    const sorted = [...list].sort((a, b) => a.date.localeCompare(b.date));
    const name = sorted[0]?.name ?? '';
    const days = new Map<string, Assignment[]>();

    for (const one of sorted) days.set(one.date, [...(days.get(one.date) ?? []), one]);

    for (const [date, sameDay] of days) {
      if (sameDay.length < 2) continue;
      const venues = new Set(sameDay.map((one) => one.congregationId));

      warnings.push({
        // Dos sedes el mismo día es un caso distinto de dos fases seguidas: la
        // persona tiene que desplazarse, y eso se avisa aparte.
        kind: venues.size > 1 ? 'twoVenues' : 'twiceSameDay',
        date,
        believerId,
        believerName: name,
        congregationId: sameDay[0]?.congregationId ?? null,
        detail: sameDay.map((one) => one.detail).join(' · '),
      });
    }

    const uniqueDays = [...days.keys()].sort((a, b) => a.localeCompare(b));
    for (const [index, date] of uniqueDays.entries()) {
      const previous = uniqueDays[index - 1];
      if (!previous || addDays(previous, 1) !== date) continue;

      warnings.push({
        kind: 'backToBack',
        date,
        believerId,
        believerName: name,
        congregationId: days.get(date)?.[0]?.congregationId ?? null,
        detail: previous,
      });
    }
  }

  return warnings;
}
