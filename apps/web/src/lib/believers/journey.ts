import type { BelieverListItem, Gift, IsoDate, MinistryCatalog } from '@navis/shared';

/**
 * Un hito de la trayectoria: qué pasó y cuándo (RFC 0012).
 *
 * `kind` no es decoración: un don se **recibe** y una labor se **empieza**, y
 * la frase cambia. Quien pinta esto elige la clave de traducción con él.
 */
export interface JourneyStep {
  key: string;
  kind: 'arrival' | 'gift' | 'ministry';
  label: string;
  date: IsoDate;
  accent: string | null;
}

/**
 * La trayectoria en orden, **solo con lo que tiene fecha**.
 *
 * Lo que no la tiene no es un hueco que rellenar: la persona tiene ese don
 * igual, y ya sale en las etiquetas de la cabecera. Aquí solo se cuenta lo que
 * se puede situar en el tiempo, que es lo que hace que esto sea una línea y no
 * otra lista de lo mismo.
 */
export function journeyOf(
  believer: BelieverListItem,
  gifts: readonly Gift[],
  ministries: readonly MinistryCatalog[],
  arrivalLabel: string,
): JourneyStep[] {
  const steps: JourneyStep[] = [];

  if (believer.arrivedAt) {
    steps.push({
      key: 'arrival',
      kind: 'arrival',
      label: arrivalLabel,
      date: believer.arrivedAt,
      accent: null,
    });
  }

  for (const gift of gifts) {
    const date = believer.giftDates[gift.id];
    if (date) {
      steps.push({
        key: `g:${gift.id}`,
        kind: 'gift',
        label: gift.name,
        date,
        accent: gift.accent,
      });
    }
  }

  for (const slug of believer.ministries) {
    const date = believer.ministryDates[slug];
    if (!date) continue;

    const catálogo = ministries.find((one) => one.slug === slug);
    steps.push({
      key: `m:${slug}`,
      kind: 'ministry',
      label: catálogo?.name ?? slug,
      date,
      accent: catálogo?.accent ?? null,
    });
  }

  return steps.sort((a, b) => a.date.localeCompare(b.date));
}
