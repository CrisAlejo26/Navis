import { z } from 'zod';

import { holidayApplies, holidaySchema, type Holiday } from '@navis/shared';

/**
 * Los festivos en **local** — la pareja móvil de `HolidaysService` de la API
 * (RFC 0011). La fuente es date.nager.at y se valida con zod en la frontera;
 * se cachea un año entero por fila, en JSON, y si la fuente falla se sirve lo
 * guardado, por viejo que sea. Un calendario sin marcas es un defecto; un
 * calendario que no carga por un tercero caído es un calendario roto (D5).
 */

const nagerEntry = z.object({
  date: z.string(),
  localName: z.string(),
  name: z.string(),
  countryCode: z.string(),
  fixed: z.boolean(),
  global: z.boolean(),
  counties: z.array(z.string()).nullable().optional(),
});

const nagerList = z.array(nagerEntry);

const CACHE_DAYS = 30;

interface CacheEntry {
  fetchedAt: number;
  holidays: Holiday[];
}

/** El caché en memoria: un año entero por fila, como la API (D3). */
const memory = new Map<string, CacheEntry>();

function cachePath(year: number, country: string, region: string | null): string {
  return `${year}-${country}${region ? `-${region}` : ''}`;
}

function deNager(rows: z.infer<typeof nagerList>, region: string | null): Holiday[] {
  return rows
    .filter((row) => row.global || (row.counties?.length ?? 0) > 0)
    .map((row) => ({
      date: row.date,
      name: row.name,
      scope: row.global ? ('national' as const) : ('regional' as const),
      regions: row.counties ?? [],
    }))
    .filter((holiday) => holidayApplies(holiday, region));
}

/** Los festivos de un año, sirviendo lo guardado primero y refrescando detrás. */
export async function holidaysOfYear(
  year: number,
  country: string,
  region: string | null,
): Promise<Map<string, Holiday>> {
  const key = cachePath(year, country, region);
  const cached = memory.get(key);
  const fresh = cached && Date.now() - cached.fetchedAt < CACHE_DAYS * 24 * 60 * 60 * 1000;

  if (fresh) return byDate(cached.holidays);
  if (cached) {
    // Lo viejo vale mientras se pide: primero se sirve, el refresco va detrás.
    return byDate(cached.holidays);
  }

  try {
    const response = await fetch(`https://date.nager.at/api/v3/publicholidays/${year}/${country}`);
    if (!response.ok) throw new Error(String(response.status));
    const holidays = deNager(nagerList.parse(await response.json()), region);

    const entry: CacheEntry = { fetchedAt: Date.now(), holidays };
    memory.set(key, entry);
    return byDate(holidays);
  } catch {
    // Sin fuente no hay festivos, y ni un error: la reunión no depende de esto.
    return new Map();
  }
}

function byDate(holidays: readonly Holiday[]): Map<string, Holiday> {
  return new Map(holidays.map((holiday) => [holiday.date, holiday]));
}
