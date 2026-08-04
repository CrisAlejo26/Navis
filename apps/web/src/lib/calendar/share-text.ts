import type { CalendarRange } from '@navis/shared';

export interface TextOptions {
  /** Cómo se escribe cada día; llega ya localizado. */
  dayLabel: (date: string) => string;
  /** El nombre de cada sede. */
  congregationName: (id: string) => string;
  /** Si se escribe la sede: con una sola, sobra. */
  showCongregation: boolean;
  /** Qué poner donde no hay nadie. */
  unassigned: string;
}

/**
 * El tramo en texto plano, listo para pegar en un grupo de WhatsApp.
 *
 * Es el respaldo de la lámina (§9.3) y lo mínimo que siempre funciona: no
 * depende de que el navegador sepa rasterizar nada. Las fases sin nadie
 * **también salen**, igual que en pantalla: si falta alguien, que se vea.
 */
export function rangeAsText(range: CalendarRange, options: TextOptions): string {
  const bloques: string[] = [];

  for (const day of range.days) {
    const conContenido = day.meetings.filter((meeting) => meeting.status !== 'cancelada');
    if (conContenido.length === 0) continue;

    for (const meeting of conContenido) {
      const sede = options.showCongregation
        ? ` · ${options.congregationName(meeting.congregationId)}`
        : '';

      const lineas = meeting.slots.map(
        (slot) => `  ${slot.name} · ${slot.believer?.name ?? options.unassigned}`,
      );

      bloques.push(
        [
          `${options.dayLabel(day.date)}${sede}`,
          `  ${meeting.name} (${meeting.startTime})`,
          ...lineas,
        ].join('\n'),
      );
    }
  }

  return bloques.join('\n\n');
}
