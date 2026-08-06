import { z } from 'zod';

import { isoDateSchema } from './common';

/**
 * Hasta dónde llega un festivo.
 *
 * Solo dos, y no es una simplificación: es el techo de lo que una fuente
 * automática sabe. Los dos festivos locales que fija cada ayuntamiento no están
 * en ningún sitio consultable, así que prometer «municipal» sería prometer algo
 * que quedaría vacío.
 */
export const HOLIDAY_SCOPES = ['national', 'regional'] as const;

export type HolidayScope = (typeof HOLIDAY_SCOPES)[number];

export const holidayScopeSchema = z.enum(HOLIDAY_SCOPES);

/** Un día festivo, ya normalizado y sin rastro de la fuente de la que salió. */
export const holidaySchema = z.object({
  date: isoDateSchema,
  /** En el idioma del país, que es como lo llama quien lo celebra. */
  name: z.string(),
  scope: holidayScopeSchema,
  /** Códigos ISO 3166-2 donde cae. Vacío ⇔ `scope` es `national`. */
  regions: z.array(z.string()),
});

export type Holiday = z.infer<typeof holidaySchema>;

/**
 * Las comunidades autónomas, para el selector de ajustes.
 *
 * Están escritas aquí porque **la fuente da el código y no el nombre**: manda
 * `ES-AN`, no «Andalucía». Solo están las de España, que es donde hay iglesias;
 * para cualquier otro país el selector enseña el código ISO tal cual, que es un
 * identificador de verdad y no un invento. Si algún día hay iglesias en otro
 * sitio, se añade su tabla aquí y el selector no se entera.
 */
export const ES_REGIONS: Readonly<Record<string, string>> = {
  'ES-AN': 'Andalucía',
  'ES-AR': 'Aragón',
  'ES-AS': 'Asturias',
  'ES-CB': 'Cantabria',
  'ES-CE': 'Ceuta',
  'ES-CL': 'Castilla y León',
  'ES-CM': 'Castilla-La Mancha',
  'ES-CN': 'Canarias',
  'ES-CT': 'Cataluña',
  'ES-EX': 'Extremadura',
  'ES-GA': 'Galicia',
  'ES-IB': 'Illes Balears',
  'ES-MC': 'Murcia',
  'ES-MD': 'Madrid',
  'ES-ML': 'Melilla',
  'ES-NC': 'Navarra',
  'ES-PV': 'País Vasco',
  'ES-RI': 'La Rioja',
  'ES-VC': 'Comunitat Valenciana',
};

/** El nombre de una comunidad, o su código si no lo tenemos. Nunca vacío. */
export function regionLabel(code: string): string {
  return ES_REGIONS[code] ?? code;
}

/**
 * Si un festivo le toca a esta iglesia.
 *
 * Sin comunidad elegida solo cuentan los nacionales: enseñarle a una iglesia de
 * Madrid el día de Andalucía sería ruido, y adivinarle la comunidad por la
 * ciudad, un acierto a medias que nadie ha pedido.
 */
export function holidayApplies(holiday: Holiday, region: string | null): boolean {
  if (holiday.scope === 'national') return true;

  return region !== null && holiday.regions.includes(region);
}
