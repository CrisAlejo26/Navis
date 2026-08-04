import { addDays, endOfMonth, startOfMonth, startOfWeek } from '@navis/shared';

import type { PosterAspect } from '@/components/calendar/poster-size';
import type { DateRange } from './view-range';

/**
 * Lo que se puede mandar: desde un solo día hasta el mes entero, o el tramo
 * que se haya seleccionado a mano.
 *
 * Son exactamente los recortes que hoy se hacen a mano sobre una captura de la
 * hoja de cálculo, que es lo que esta función viene a sustituir.
 */
export const SHARE_PRESETS = [
  'day',
  'week',
  'twoWeeks',
  'threeWeeks',
  'fourWeeks',
  'month',
] as const;

export type SharePreset = (typeof SHARE_PRESETS)[number];

export const SHARE_LABELS: Record<SharePreset, string> = {
  day: 'calendar.shareOneDay',
  week: 'calendar.shareWeek',
  twoWeeks: 'calendar.shareTwoWeeks',
  threeWeeks: 'calendar.shareThreeWeeks',
  fourWeeks: 'calendar.shareFourWeeks',
  month: 'calendar.shareMonth',
};

const WEEKS: Partial<Record<SharePreset, number>> = {
  week: 1,
  twoWeeks: 2,
  threeWeeks: 3,
  fourWeeks: 4,
};

/**
 * El tramo de cada opción, contado desde el día que se está mirando.
 *
 * El mes va **del 1 al último**, no encuadrado en semanas: en la lámina, los
 * días del mes anterior sobran.
 */
export function shareRangeFor(preset: SharePreset, anchor: string, day: string | null): DateRange {
  if (preset === 'day') {
    const date = day ?? anchor;
    return { from: date, to: date };
  }

  if (preset === 'month') {
    return { from: startOfMonth(anchor), to: endOfMonth(anchor) };
  }

  const from = startOfWeek(day ?? anchor);
  return { from, to: addDays(from, (WEEKS[preset] ?? 1) * 7 - 1) };
}

/**
 * Vertical para un día suelto, **tabla** para una semana —que es como se manda
 * hoy al grupo, una columna por día y sede— y apaisada para lo que ya no cabe.
 */
export function suggestedAspect(preset: SharePreset): PosterAspect {
  if (preset === 'day') return 'portrait';
  if (preset === 'week' || preset === 'twoWeeks') return 'table';
  return 'landscape';
}
