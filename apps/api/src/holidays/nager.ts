import { type Holiday } from '@navis/shared';
import { z } from 'zod';

/**
 * La forma de lo que devuelve la fuente (date.nager.at), **validada aquí y no
 * más adentro** (Regla 10 §3).
 *
 * De la respuesta solo interesan cuatro campos, así que el resto se ignora: un
 * campo nuevo en la fuente no puede romper esto, y uno que desaparezca lo caza
 * el esquema en el sitio donde entra el dato y no tres capas después.
 */
const sourceHolidaySchema = z.object({
  date: z.string(),
  /** Cómo lo llama quien lo celebra: «Día de Andalucía», no «Day of Andalucía». */
  localName: z.string(),
  name: z.string(),
  /** `true` ⇒ de todo el país. Cuando es `false`, `counties` dice dónde. */
  global: z.boolean(),
  counties: z.array(z.string()).nullable(),
});

const sourceSchema = z.array(sourceHolidaySchema);

/**
 * Los festivos de un país y un año, ya normalizados.
 *
 * Lanza si la fuente no responde o contesta algo que no es lo esperado: quien
 * llama decide qué hacer con eso, y lo que hace es servir lo que tenga
 * guardado (ver `HolidaysService`).
 */
export async function fetchHolidays(
  baseUrl: string,
  country: string,
  year: number,
  fetchImpl: typeof fetch,
): Promise<Holiday[]> {
  const url = `${baseUrl.replace(/\/+$/, '')}/PublicHolidays/${String(year)}/${country}`;
  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });

  if (!response.ok) throw new Error(`La fuente de festivos contestó ${String(response.status)}`);

  return sourceSchema.parse(await response.json()).map(toHoliday);
}

function toHoliday(source: z.infer<typeof sourceHolidaySchema>): Holiday {
  const regions = source.global ? [] : (source.counties ?? []);

  return {
    // Llega como `AAAA-MM-DD`; si algún día llegara con hora, el día es lo único
    // que significa algo en un festivo.
    date: source.date.slice(0, 10),
    name: source.localName || source.name,
    // Sin `counties` y sin `global` no se sabe a quién le toca, y un festivo que
    // no se sabe de quién es no se puede filtrar: se trata como nacional, que
    // es lo que hace la propia fuente cuando pone `global`.
    scope: regions.length > 0 ? 'regional' : 'national',
    regions,
  };
}
